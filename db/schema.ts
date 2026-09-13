import {
  index,
  integer,
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
