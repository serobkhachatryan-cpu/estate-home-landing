import { env } from 'cloudflare:workers';

let setupPromise: Promise<void> | undefined;

export function database() {
  const databaseBinding = (env as { DB?: D1Database }).DB;
  if (!databaseBinding) {
    throw new Error('The Oriel data store is not configured.');
  }
  return databaseBinding;
}

function isDuplicateAreaColumnError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.toLowerCase().includes('duplicate column name')
  );
}

/**
 * Migrations are packaged for hosted releases. This guarded bootstrap keeps a
 * local developer database compatible without relying on browser storage.
 */
export async function ensureSchema() {
  if (!setupPromise) {
    const db = database();
    setupPromise = db
      .batch([
        db.prepare(
          `CREATE TABLE IF NOT EXISTS app_users (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL,
            display_name TEXT NOT NULL,
            created_at TEXT NOT NULL,
            last_seen_at TEXT NOT NULL
          )`,
        ),
        db.prepare(
          `CREATE TABLE IF NOT EXISTS w3ds_auth_offers (
            session_id TEXT PRIMARY KEY,
            browser_proof_hash TEXT NOT NULL,
            return_to TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            completed_ename TEXT,
            completed_at TEXT,
            claimed_at TEXT,
            created_at TEXT NOT NULL
          )`,
        ),
        db.prepare(
          `CREATE TABLE IF NOT EXISTS w3ds_auth_sessions (
            token_hash TEXT PRIMARY KEY,
            ename TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            created_at TEXT NOT NULL
          )`,
        ),
        db.prepare(
          `CREATE TABLE IF NOT EXISTS home_assistant_auth_offers (
            session_id TEXT PRIMARY KEY,
            owner_ename TEXT NOT NULL,
            instance_url TEXT NOT NULL,
            electricity_entity_id TEXT NOT NULL,
            water_entity_id TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            completed_at TEXT,
            created_at TEXT NOT NULL
          )`,
        ),
        db.prepare(
          `CREATE TABLE IF NOT EXISTS home_assistant_connections (
            owner_ename TEXT PRIMARY KEY,
            instance_url TEXT NOT NULL,
            client_id TEXT NOT NULL,
            electricity_entity_id TEXT NOT NULL,
            water_entity_id TEXT NOT NULL,
            access_token_encrypted TEXT NOT NULL,
            refresh_token_encrypted TEXT NOT NULL,
            access_token_expires_at TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )`,
        ),
        db.prepare(
          `CREATE TABLE IF NOT EXISTS properties (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            area TEXT NOT NULL DEFAULT 'London',
            currency TEXT NOT NULL DEFAULT 'GBP',
            timezone TEXT NOT NULL DEFAULT 'Europe/London',
            created_at TEXT NOT NULL
          )`,
        ),
        db.prepare(
          `CREATE TABLE IF NOT EXISTS property_memberships (
            id TEXT PRIMARY KEY,
            property_id TEXT NOT NULL REFERENCES properties(id),
            user_id TEXT NOT NULL REFERENCES app_users(id),
            role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'manager', 'observer')),
            created_at TEXT NOT NULL,
            UNIQUE(property_id, user_id)
          )`,
        ),
        db.prepare(
          `CREATE TABLE IF NOT EXISTS spend_records (
            id TEXT PRIMARY KEY,
            property_id TEXT NOT NULL REFERENCES properties(id),
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            supplier TEXT,
            amount_pence INTEGER NOT NULL CHECK (amount_pence > 0),
            entry_date TEXT NOT NULL,
            kind TEXT NOT NULL DEFAULT 'fact' CHECK (kind IN ('plan', 'fact', 'forecast')),
            status TEXT NOT NULL DEFAULT 'posted' CHECK (status = 'posted'),
            created_at TEXT NOT NULL
          )`,
        ),
        db.prepare(
          `CREATE INDEX IF NOT EXISTS idx_spend_records_property_date
           ON spend_records(property_id, entry_date DESC)`,
        ),
        db.prepare(
          `CREATE INDEX IF NOT EXISTS idx_property_memberships_user
           ON property_memberships(user_id)`,
        ),
        db.prepare(
          `CREATE INDEX IF NOT EXISTS idx_w3ds_auth_offers_expires
           ON w3ds_auth_offers(expires_at)`,
        ),
        db.prepare(
          `CREATE INDEX IF NOT EXISTS idx_w3ds_auth_sessions_expires
           ON w3ds_auth_sessions(expires_at)`,
        ),
        db.prepare(
          `CREATE INDEX IF NOT EXISTS idx_home_assistant_auth_offers_expires
           ON home_assistant_auth_offers(expires_at)`,
        ),
      ])
      .then(async () => {
        try {
          await db
            .prepare(
              "ALTER TABLE properties ADD COLUMN area TEXT NOT NULL DEFAULT 'London'",
            )
            .run();
        } catch (error) {
          if (!isDuplicateAreaColumnError(error)) throw error;
        }
        await db.prepare('PRAGMA optimize').run();
      })
      .catch((error) => {
        setupPromise = undefined;
        throw error;
      });
  }

  await setupPromise;
}
