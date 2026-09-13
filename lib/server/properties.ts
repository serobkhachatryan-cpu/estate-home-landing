import type { AuthenticatedViewer } from '@/lib/server/auth';
import { database, ensureSchema } from '@/lib/server/database';

export const PROPERTY_TIMEZONES = [
  'Europe/London',
  'Europe/Paris',
  'Europe/Yerevan',
  'Asia/Dubai',
  'America/New_York',
] as const;

export type PropertyRole = 'owner' | 'manager' | 'observer';

export type PropertySummary = {
  id: string;
  name: string;
  area: string;
  currency: 'GBP';
  timezone: string;
  role: PropertyRole;
};

export type NewProperty = Pick<PropertySummary, 'name' | 'area' | 'timezone'>;

function mapProperty(row: Record<string, unknown>): PropertySummary {
  return {
    id: String(row.id),
    name: String(row.name),
    area: String(row.area),
    currency: 'GBP',
    timezone: String(row.timezone),
    role: row.role as PropertyRole,
  };
}

async function ensureViewer(viewer: AuthenticatedViewer) {
  await ensureSchema();
  const now = new Date().toISOString();
  await database()
    .prepare(
      `INSERT INTO app_users (id, email, display_name, created_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         email = excluded.email,
         display_name = excluded.display_name,
         last_seen_at = excluded.last_seen_at`,
    )
    .bind(viewer.id, '', viewer.displayName, now, now)
    .run();
}

export async function listPropertiesForViewer(viewer: AuthenticatedViewer) {
  await ensureViewer(viewer);
  const result = await database()
    .prepare(
      `SELECT p.id, p.name, p.area, p.currency, p.timezone, m.role
       FROM property_memberships m
       JOIN properties p ON p.id = m.property_id
       WHERE m.user_id = ?
       ORDER BY p.created_at ASC`,
    )
    .bind(viewer.id)
    .all<Record<string, unknown>>();

  return (result.results ?? []).map(mapProperty);
}

export async function getPropertyForViewer(
  viewer: AuthenticatedViewer,
  propertyId: string,
) {
  await ensureViewer(viewer);
  const result = await database()
    .prepare(
      `SELECT p.id, p.name, p.area, p.currency, p.timezone, m.role
       FROM property_memberships m
       JOIN properties p ON p.id = m.property_id
       WHERE m.user_id = ? AND p.id = ?
       LIMIT 1`,
    )
    .bind(viewer.id, propertyId)
    .first<Record<string, unknown>>();

  return result ? mapProperty(result) : null;
}

function assertTimezone(value: string) {
  if (
    !PROPERTY_TIMEZONES.includes(value as (typeof PROPERTY_TIMEZONES)[number])
  ) {
    throw new Error('Choose a supported property time zone.');
  }
}

export function validateNewProperty(input: unknown): NewProperty {
  if (!input || typeof input !== 'object') {
    throw new Error('Enter the property details to continue.');
  }

  const body = input as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const area = typeof body.area === 'string' ? body.area.trim() : '';
  const timezone = typeof body.timezone === 'string' ? body.timezone : '';

  if (!name || name.length > 100) {
    throw new Error('Add a property name of up to 100 characters.');
  }
  if (!area || area.length > 120) {
    throw new Error('Add a location of up to 120 characters.');
  }
  assertTimezone(timezone);

  return { name, area, timezone };
}

export async function createPropertyForViewer(
  viewer: AuthenticatedViewer,
  input: NewProperty,
) {
  await ensureViewer(viewer);
  const db = database();
  const now = new Date().toISOString();
  const property: PropertySummary = {
    id: crypto.randomUUID(),
    ...input,
    currency: 'GBP',
    role: 'owner',
  };

  await db.batch([
    db
      .prepare(
        `INSERT INTO properties (id, name, area, currency, timezone, created_at)
         VALUES (?, ?, ?, 'GBP', ?, ?)`,
      )
      .bind(property.id, property.name, property.area, property.timezone, now),
    db
      .prepare(
        `INSERT INTO property_memberships (id, property_id, user_id, role, created_at)
         VALUES (?, ?, ?, 'owner', ?)`,
      )
      .bind(crypto.randomUUID(), property.id, viewer.id, now),
  ]);

  return property;
}

export function canWriteProperty(property: PropertySummary) {
  return property.role === 'owner' || property.role === 'manager';
}
