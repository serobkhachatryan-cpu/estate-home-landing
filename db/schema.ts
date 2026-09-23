import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

/**
 * The first durable part of Oriel: an operational spend ledger.
 *
 * Values are stored in pence to keep money arithmetic exact. Dates remain
 * YYYY-MM-DD strings because estate operating records are usually recorded
 * against a local business date rather than a point in time.
 */
export const appUsers = sqliteTable('app_users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  displayName: text('display_name').notNull(),
  createdAt: text('created_at').notNull(),
  lastSeenAt: text('last_seen_at').notNull(),
});

/**
 * W3DS authentication is local-only operational state. It is deliberately
 * separate from property data: offers expire quickly and sessions only prove
 * that a wallet signed an Oriel login request.
 */
export const w3dsAuthOffers = sqliteTable(
  'w3ds_auth_offers',
  {
    sessionId: text('session_id').primaryKey(),
    browserProofHash: text('browser_proof_hash').notNull(),
    returnTo: text('return_to').notNull(),
    expiresAt: text('expires_at').notNull(),
    completedEname: text('completed_ename'),
    completedAt: text('completed_at'),
    claimedAt: text('claimed_at'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('idx_w3ds_auth_offers_expires').on(table.expiresAt)],
);

export const w3dsAuthSessions = sqliteTable(
  'w3ds_auth_sessions',
  {
    tokenHash: text('token_hash').primaryKey(),
    ename: text('ename').notNull(),
    expiresAt: text('expires_at').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('idx_w3ds_auth_sessions_expires').on(table.expiresAt)],
);

/**
 * Home Assistant OAuth offers and encrypted credentials are local-only
 * operational state. They are never eVault records and are removed when the
 * owner disconnects the integration.
 */
export const homeAssistantAuthOffers = sqliteTable(
  'home_assistant_auth_offers',
  {
    sessionId: text('session_id').primaryKey(),
    ownerEname: text('owner_ename').notNull(),
    instanceUrl: text('instance_url').notNull(),
    electricityEntityId: text('electricity_entity_id').notNull(),
    waterEntityId: text('water_entity_id').notNull(),
    expiresAt: text('expires_at').notNull(),
    completedAt: text('completed_at'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('idx_home_assistant_auth_offers_expires').on(table.expiresAt),
  ],
);

export const homeAssistantConnections = sqliteTable(
  'home_assistant_connections',
  {
    ownerEname: text('owner_ename').primaryKey(),
    instanceUrl: text('instance_url').notNull(),
    clientId: text('client_id').notNull(),
    electricityEntityId: text('electricity_entity_id').notNull(),
    waterEntityId: text('water_entity_id').notNull(),
    accessTokenEncrypted: text('access_token_encrypted').notNull(),
    refreshTokenEncrypted: text('refresh_token_encrypted').notNull(),
    accessTokenExpiresAt: text('access_token_expires_at').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
);

/**
 * Normalized utility history is deliberately separate from any original Home
 * Assistant recorder. The production database receives only calculated daily
 * values, never an archive or Home Assistant credential.
 */
export const utilityHistoryImports = sqliteTable(
  'utility_history_imports',
  {
    ownerEname: text('owner_ename').notNull(),
    utility: text('utility').notNull(),
    sourceLabel: text('source_label').notNull(),
    sourceScope: text('source_scope').notNull(),
    sourceEntityId: text('source_entity_id').notNull(),
    unit: text('unit').notNull(),
    timezone: text('timezone').notNull(),
    firstObservedAt: text('first_observed_at').notNull(),
    dataThrough: text('data_through').notNull(),
    importedAt: text('imported_at').notNull(),
    quality: text('quality').notNull(),
    qualityDetail: text('quality_detail'),
    ratePencePerUnit: real('rate_pence_per_unit'),
  },
  (table) => [primaryKey({ columns: [table.ownerEname, table.utility] })],
);

export const utilityHistoryDailyPoints = sqliteTable(
  'utility_history_daily_points',
  {
    ownerEname: text('owner_ename').notNull(),
    utility: text('utility').notNull(),
    day: text('day').notNull(),
    consumption: real('consumption').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.ownerEname, table.utility, table.day] }),
    index('idx_utility_history_daily_points_lookup').on(
      table.ownerEname,
      table.utility,
      table.day,
    ),
  ],
);

/**
 * Recorder-derived sensor history is stored as complete daily values. The
 * raw Home Assistant database stays on the owner's machine.
 */
export const sensorHistoryImports = sqliteTable(
  'sensor_history_imports',
  {
    ownerEname: text('owner_ename').notNull(),
    entityId: text('entity_id').notNull(),
    label: text('label').notNull(),
    deviceLabel: text('device_label'),
    areaLabel: text('area_label'),
    groupId: text('group_id').notNull(),
    groupLabel: text('group_label').notNull(),
    unit: text('unit'),
    unitClass: text('unit_class'),
    aggregation: text('aggregation').notNull(),
    isArchived: integer('is_archived').notNull().default(0),
    firstObservedAt: text('first_observed_at').notNull(),
    dataThrough: text('data_through').notNull(),
    importedAt: text('imported_at').notNull(),
    quality: text('quality').notNull(),
    qualityDetail: text('quality_detail'),
    pointCount: integer('point_count').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.ownerEname, table.entityId] }),
    index('idx_sensor_history_imports_group').on(
      table.ownerEname,
      table.groupId,
      table.label,
    ),
  ],
);

export const sensorHistoryDailyPoints = sqliteTable(
  'sensor_history_daily_points',
  {
    ownerEname: text('owner_ename').notNull(),
    entityId: text('entity_id').notNull(),
    day: text('day').notNull(),
    value: real('value').notNull(),
    minimum: real('minimum'),
    maximum: real('maximum'),
    sampleCount: integer('sample_count').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.ownerEname, table.entityId, table.day] }),
    index('idx_sensor_history_daily_points_lookup').on(
      table.ownerEname,
      table.entityId,
      table.day,
    ),
  ],
);

/**
 * One compact, recalculated week-to-date value per imported sensor. This is
 * not a Recorder mirror: the raw state events remain on the owner's Home
 * Assistant unit.
 */
export const sensorHistoryCurrentWeeks = sqliteTable(
  'sensor_history_current_weeks',
  {
    ownerEname: text('owner_ename').notNull(),
    entityId: text('entity_id').notNull(),
    weekStart: text('week_start').notNull(),
    value: real('value').notNull(),
    minimum: real('minimum'),
    maximum: real('maximum'),
    dayCount: integer('day_count').notNull(),
    observedAt: text('observed_at').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.ownerEname, table.entityId] }),
    index('idx_sensor_history_current_weeks_owner_week').on(
      table.ownerEname,
      table.weekStart,
    ),
  ],
);

/**
 * A viewer receives only an opaque bearer secret in a URL fragment. D1 keeps
 * its SHA-256 digest, never the share secret itself.
 */
export const investorShares = sqliteTable(
  'investor_shares',
  {
    shareHash: text('share_hash').primaryKey(),
    ownerEname: text('owner_ename').notNull(),
    label: text('label').notNull(),
    expiresAt: text('expires_at'),
    revokedAt: text('revoked_at'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('idx_investor_shares_owner_expires').on(
      table.ownerEname,
      table.expiresAt,
    ),
  ],
);

/**
 * The local Home Assistant bridge writes a replacement snapshot of explicitly
 * allowlisted sensor states. This is intentionally current-state storage, not
 * a second Recorder: no credentials, events, service calls or raw history are
 * retained in Oriel.
 */
export const homeAssistantLiveStates = sqliteTable(
  'home_assistant_live_states',
  {
    ownerEname: text('owner_ename').notNull(),
    entityId: text('entity_id').notNull(),
    groupId: text('group_id').notNull(),
    label: text('label').notNull(),
    state: text('state').notNull(),
    unit: text('unit'),
    stateUpdatedAt: text('state_updated_at').notNull(),
    observedAt: text('observed_at').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.ownerEname, table.entityId] }),
    index('idx_home_assistant_live_states_owner_group').on(
      table.ownerEname,
      table.groupId,
      table.label,
    ),
  ],
);

export const properties = sqliteTable('properties', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  area: text('area').notNull().default('London'),
  currency: text('currency').notNull().default('GBP'),
  timezone: text('timezone').notNull().default('Europe/London'),
  createdAt: text('created_at').notNull(),
});

export const propertyMemberships = sqliteTable(
  'property_memberships',
  {
    id: text('id').primaryKey(),
    propertyId: text('property_id')
      .notNull()
      .references(() => properties.id),
    userId: text('user_id')
      .notNull()
      .references(() => appUsers.id),
    role: text('role').notNull().default('owner'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_property_memberships_property_user').on(
      table.propertyId,
      table.userId,
    ),
    index('idx_property_memberships_user').on(table.userId),
  ],
);

export const spendRecords = sqliteTable(
  'spend_records',
  {
    id: text('id').primaryKey(),
    propertyId: text('property_id')
      .notNull()
      .references(() => properties.id),
    category: text('category').notNull(),
    description: text('description').notNull(),
    supplier: text('supplier'),
    amountPence: integer('amount_pence').notNull(),
    entryDate: text('entry_date').notNull(),
    kind: text('kind').notNull().default('fact'),
    status: text('status').notNull().default('posted'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('idx_spend_records_property_date').on(
      table.propertyId,
      table.entryDate,
    ),
  ],
);
