import { env } from 'cloudflare:workers';

let setupPromise: Promise<void> | undefined;

export function database() {
  const databaseBinding = (env as { DB?: D1Database }).DB;
  if (!databaseBinding) {
    throw new Error('The Oriel data store is not configured.');
  }
  return databaseBinding;
}

function isDuplicateColumnError(error: unknown) {
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
            failure_code TEXT,
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
          `CREATE TABLE IF NOT EXISTS utility_history_imports (
            owner_ename TEXT NOT NULL,
            utility TEXT NOT NULL CHECK (utility IN ('electricity', 'water')),
            source_label TEXT NOT NULL,
            source_scope TEXT NOT NULL,
            source_entity_id TEXT NOT NULL,
            unit TEXT NOT NULL,
            timezone TEXT NOT NULL,
            first_observed_at TEXT NOT NULL,
            data_through TEXT NOT NULL,
            imported_at TEXT NOT NULL,
            quality TEXT NOT NULL CHECK (quality IN ('available', 'needs_review')),
            quality_detail TEXT,
            rate_pence_per_unit REAL,
            PRIMARY KEY (owner_ename, utility)
          )`,
        ),
        db.prepare(
          `CREATE TABLE IF NOT EXISTS utility_history_daily_points (
            owner_ename TEXT NOT NULL,
            utility TEXT NOT NULL CHECK (utility IN ('electricity', 'water')),
            day TEXT NOT NULL,
            consumption REAL NOT NULL CHECK (consumption >= 0),
            PRIMARY KEY (owner_ename, utility, day),
            FOREIGN KEY (owner_ename, utility)
              REFERENCES utility_history_imports(owner_ename, utility)
              ON DELETE CASCADE
          )`,
        ),
        db.prepare(
          `CREATE TABLE IF NOT EXISTS sensor_history_imports (
            owner_ename TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            label TEXT NOT NULL,
            device_label TEXT,
            area_label TEXT,
            group_id TEXT NOT NULL,
            group_label TEXT NOT NULL,
            unit TEXT,
            unit_class TEXT,
            aggregation TEXT NOT NULL
              CHECK (aggregation IN ('daily_total', 'daily_average')),
            is_archived INTEGER NOT NULL DEFAULT 0
              CHECK (is_archived IN (0, 1)),
            first_observed_at TEXT NOT NULL,
            data_through TEXT NOT NULL,
            imported_at TEXT NOT NULL,
            quality TEXT NOT NULL CHECK (quality IN ('available', 'needs_review')),
            quality_detail TEXT,
            point_count INTEGER NOT NULL CHECK (point_count >= 0),
            PRIMARY KEY (owner_ename, entity_id)
          )`,
        ),
        db.prepare(
          `CREATE TABLE IF NOT EXISTS sensor_history_daily_points (
            owner_ename TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            day TEXT NOT NULL,
            value REAL NOT NULL,
            minimum REAL,
            maximum REAL,
            sample_count INTEGER NOT NULL CHECK (sample_count >= 0),
            PRIMARY KEY (owner_ename, entity_id, day),
            FOREIGN KEY (owner_ename, entity_id)
              REFERENCES sensor_history_imports(owner_ename, entity_id)
              ON DELETE CASCADE
          )`,
        ),
        db.prepare(
          `CREATE TABLE IF NOT EXISTS investor_shares (
            share_hash TEXT PRIMARY KEY,
            owner_ename TEXT NOT NULL,
            label TEXT NOT NULL,
            expires_at TEXT,
            revoked_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )`,
        ),
        db.prepare(
          `CREATE TABLE IF NOT EXISTS home_assistant_live_states (
            owner_ename TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            group_id TEXT NOT NULL,
            label TEXT NOT NULL,
            state TEXT NOT NULL,
            unit TEXT,
            state_updated_at TEXT NOT NULL,
            observed_at TEXT NOT NULL,
            PRIMARY KEY (owner_ename, entity_id)
          )`,
        ),
        db.prepare(
          `CREATE TABLE IF NOT EXISTS sensor_history_current_weeks (
            owner_ename TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            week_start TEXT NOT NULL,
            value REAL NOT NULL,
            minimum REAL,
            maximum REAL,
            day_count INTEGER NOT NULL CHECK (day_count BETWEEN 1 AND 7),
            observed_at TEXT NOT NULL,
            PRIMARY KEY (owner_ename, entity_id),
            FOREIGN KEY (owner_ename, entity_id)
              REFERENCES sensor_history_imports(owner_ename, entity_id)
              ON DELETE CASCADE
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
        db.prepare(
          `CREATE INDEX IF NOT EXISTS idx_utility_history_daily_points_lookup
           ON utility_history_daily_points(owner_ename, utility, day DESC)`,
        ),
        db.prepare(
          `CREATE INDEX IF NOT EXISTS idx_sensor_history_imports_group
           ON sensor_history_imports(owner_ename, group_id, label)`,
        ),
        db.prepare(
          `CREATE INDEX IF NOT EXISTS idx_sensor_history_daily_points_lookup
           ON sensor_history_daily_points(owner_ename, entity_id, day DESC)`,
        ),
        db.prepare(
          `CREATE INDEX IF NOT EXISTS idx_investor_shares_owner_expires
           ON investor_shares(owner_ename, expires_at)`,
        ),
        db.prepare(
          `CREATE INDEX IF NOT EXISTS idx_home_assistant_live_states_owner_group
           ON home_assistant_live_states(owner_ename, group_id, label)`,
        ),
        db.prepare(
          `CREATE INDEX IF NOT EXISTS idx_sensor_history_current_weeks_owner_week
           ON sensor_history_current_weeks(owner_ename, week_start)`,
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
          if (!isDuplicateColumnError(error)) throw error;
        }
        try {
          await db
            .prepare(
              'ALTER TABLE sensor_history_imports ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0',
            )
            .run();
        } catch (error) {
          if (!isDuplicateColumnError(error)) throw error;
        }
        try {
          await db
            .prepare(
              'ALTER TABLE w3ds_auth_offers ADD COLUMN failure_code TEXT',
            )
            .run();
        } catch (error) {
          if (!isDuplicateColumnError(error)) throw error;
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
