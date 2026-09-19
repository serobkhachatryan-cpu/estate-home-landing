#!/usr/bin/env node

const SOURCES_PER_REQUEST = 12;

function usage(message) {
  if (message) console.error(`Error: ${message}\n`);
  console.error(
    'Usage: node scripts/transfer-normalized-investor-snapshot.mjs --source <local-oriel-url> --destination <public-oriel-url> --import-token <secret> --share-hash <sha256> --owner <snapshot-owner> --expires-at <ISO timestamp>',
  );
  process.exitCode = 1;
}

function parseArguments(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const name = argv[index];
    const value = argv[index + 1];
    if (!name?.startsWith('--') || !value || value.startsWith('--')) {
      usage('Arguments must be supplied as --name value pairs.');
      return null;
    }
    values.set(name.slice(2), value);
  }

  const required = [
    'source',
    'destination',
    'import-token',
    'share-hash',
    'owner',
    'expires-at',
  ];
  if (required.some((key) => !values.get(key))) {
    usage(`The --${required.join(', --')} arguments are required.`);
    return null;
  }

  const expiresAt = new Date(values.get('expires-at'));
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    usage('--expires-at must be a future ISO timestamp.');
    return null;
  }

  return {
    source: values.get('source').replace(/\/$/, ''),
    destination: values.get('destination').replace(/\/$/, ''),
    importToken: values.get('import-token'),
    shareHash: values.get('share-hash').toLowerCase(),
    owner: values.get('owner'),
    expiresAt: expiresAt.toISOString(),
  };
}

async function readJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`The local normalised history is unavailable (${response.status}).`);
  return response.json();
}

async function postSnapshot(destination, importToken, body) {
  const response = await fetch(`${destination}/api/internal/investor-snapshot`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${importToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`The hosted snapshot import was rejected (${response.status}).`);
  }
}

function asSourceHistory(value) {
  if (!value || typeof value !== 'object') return null;
  const result = value;
  if (result.status !== 'available' || !result.source || !Array.isArray(result.daily)) {
    return null;
  }
  return {
    ...result.source,
    daily: result.daily.map((day) => ({
      day: day.date,
      value: day.value,
      minimum: day.minimum,
      maximum: day.maximum,
      sampleCount: day.sampleCount,
    })),
  };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (!options) return;

  const overview = await readJson(`${options.source}/api/sensor-history`);
  if (
    !overview ||
    overview.status !== 'available' ||
    !Array.isArray(overview.sources) ||
    !overview.sources.length
  ) {
    throw new Error('No normalized sensor sources are available to transfer.');
  }

  const sources = [];
  for (const item of overview.sources) {
    if (!item || typeof item.entityId !== 'string') continue;
    const history = await readJson(
      `${options.source}/api/sensor-history/${encodeURIComponent(item.entityId)}`,
    );
    const normalized = asSourceHistory(history);
    if (!normalized) throw new Error('A normalized source could not be read.');
    sources.push(normalized);
  }

  for (let index = 0; index < sources.length; index += SOURCES_PER_REQUEST) {
    await postSnapshot(options.destination, options.importToken, {
      operation: 'replace_sources',
      ownerEName: options.owner,
      sources: sources.slice(index, index + SOURCES_PER_REQUEST),
    });
  }

  await postSnapshot(options.destination, options.importToken, {
    operation: 'publish_share',
    ownerEName: options.owner,
    shareHash: options.shareHash,
    label: 'Aldworth recorded systems',
    expiresAt: options.expiresAt,
  });

  console.log(`Transferred ${sources.length} normalized historical sources.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Snapshot transfer failed.');
  process.exitCode = 1;
});
