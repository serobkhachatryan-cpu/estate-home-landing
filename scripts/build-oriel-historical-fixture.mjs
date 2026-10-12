#!/usr/bin/env node

/*
 * Creates a LOCAL-ONLY Oriel-card fixture from the Aldworth Recorder copy.
 * The generated module is ignored by Git so raw history can never be pushed.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const root = resolve(import.meta.dirname, '..');
const dbPath = process.argv[2] || resolve(root, 'data/imports/aldworth/analysis/data/home-assistant_v2.db');
const manifestPath = process.argv[3] || resolve(root, 'data/imports/aldworth/analysis/oriel-utility-history-manifest.json');
const outputPath = resolve(root, 'public/oriel-private/aldworth-history.js');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const db = new DatabaseSync(dbPath, { readOnly: true });

try {
  const sources = {};
  let anchor = 0;
  for (const source of manifest.sources) {
    const last = db.prepare(`SELECT MAX(start_ts) AS value FROM statistics s JOIN statistics_meta m ON m.id = s.metadata_id WHERE m.statistic_id = ?`).get(source.entityId)?.value;
    if (!Number.isFinite(last)) throw new Error(`No statistics for ${source.entityId}`);
    anchor = Math.max(anchor, Number(last) * 1000);
  }
  // The card shows the six weeks ending at the archive's last common data date.
  const start = Math.floor((anchor - 8 * 7 * 86400000) / 1000);
  for (const source of manifest.sources) {
    const rows = db.prepare(
      `SELECT s.start_ts AS timestamp, s.state AS state
       FROM statistics s JOIN statistics_meta m ON m.id = s.metadata_id
       WHERE m.statistic_id = ? AND s.start_ts >= ? AND s.state IS NOT NULL
       ORDER BY s.start_ts`,
    ).all(source.entityId, start);
    if (!rows.length) throw new Error(`No usable rows for ${source.entityId}`);
    const history = rows.map((row) => ({ state: String(row.state), last_updated: new Date(Number(row.timestamp) * 1000).toISOString() }));
    sources[source.entityId] = {
      state: history.at(-1).state,
      label: source.label,
      unit: source.unit,
      deviceClass: source.utility === 'electricity' ? 'energy' : 'volume',
      history,
    };
  }
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `// Generated locally from the private Aldworth Recorder archive. DO NOT COMMIT.\nwindow.__orielAldworthHistoryFixture = ${JSON.stringify({ anchor: new Date(anchor).toISOString(), sources })};\n`, 'utf8');
  console.log(`Created ${outputPath} with ${Object.keys(sources).length} approved source series through ${new Date(anchor).toISOString()}.`);
} finally {
  db.close();
}
