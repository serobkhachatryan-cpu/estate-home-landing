import { database, ensureSchema } from '@/lib/server/database';

export const SPEND_CATEGORIES = [
  'occupancy',
  'staff',
  'utilities',
  'transportation',
  'renovation',
  'inventory',
  'care',
] as const;

export type SpendCategory = (typeof SPEND_CATEGORIES)[number];
export type SpendKind = 'plan' | 'fact' | 'forecast';

export type SpendRecord = {
  id: string;
  category: SpendCategory;
  description: string;
  supplier: string | null;
  amountPence: number;
  entryDate: string;
  kind: SpendKind;
  status: 'posted';
  createdAt: string;
};

export type NewSpendRecord = Omit<SpendRecord, 'id' | 'createdAt' | 'status'>;

function assertCategory(category: string): asserts category is SpendCategory {
  if (!SPEND_CATEGORIES.includes(category as SpendCategory)) {
    throw new Error('Choose a valid operating category.');
  }
}

function assertKind(kind: string): asserts kind is SpendKind {
  if (!['plan', 'fact', 'forecast'].includes(kind)) {
    throw new Error('Choose Plan, Fact, or Forecast.');
  }
}

function assertBusinessDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('Enter a valid date.');
  }

  const parsed = new Date(`${value}T12:00:00Z`);
  if (
    Number.isNaN(parsed.valueOf()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    throw new Error('Enter a valid date.');
  }
}

function mapRecord(row: Record<string, unknown>): SpendRecord {
  return {
    id: String(row.id),
    category: row.category as SpendCategory,
    description: String(row.description),
    supplier: typeof row.supplier === 'string' ? row.supplier : null,
    amountPence: Number(row.amount_pence),
    entryDate: String(row.entry_date),
    kind: row.kind as SpendKind,
    status: 'posted',
    createdAt: String(row.created_at),
  };
}

export async function listSpendRecords(propertyId: string) {
  await ensureSchema();

  const result = await database()
    .prepare(
      `SELECT id, category, description, supplier, amount_pence, entry_date, kind, created_at
       FROM spend_records
       WHERE property_id = ?
       ORDER BY entry_date DESC, created_at DESC
       LIMIT 50`,
    )
    .bind(propertyId)
    .all<Record<string, unknown>>();

  return (result.results ?? []).map(mapRecord);
}

export function validateSpendRecord(input: unknown): NewSpendRecord {
  if (!input || typeof input !== 'object') {
    throw new Error('Enter the cost details to continue.');
  }

  const body = input as Record<string, unknown>;
  const category = typeof body.category === 'string' ? body.category : '';
  const description =
    typeof body.description === 'string' ? body.description.trim() : '';
  const supplier =
    typeof body.supplier === 'string' ? body.supplier.trim() : '';
  const entryDate = typeof body.entryDate === 'string' ? body.entryDate : '';
  const kind = typeof body.kind === 'string' ? body.kind : '';
  const amount = Number(body.amountPounds);

  assertCategory(category);
  assertKind(kind);
  assertBusinessDate(entryDate);

  if (!description || description.length > 140) {
    throw new Error('Add a description of up to 140 characters.');
  }

  if (supplier.length > 100) {
    throw new Error('Supplier names must be 100 characters or fewer.');
  }

  if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) {
    throw new Error('Enter an amount between £0.01 and £10,000,000.');
  }

  return {
    category,
    description,
    supplier: supplier || null,
    amountPence: Math.round(amount * 100),
    entryDate,
    kind,
  };
}

export async function createSpendRecord(
  propertyId: string,
  input: NewSpendRecord,
) {
  await ensureSchema();

  const record: SpendRecord = {
    id: crypto.randomUUID(),
    ...input,
    status: 'posted',
    createdAt: new Date().toISOString(),
  };

  await database()
    .prepare(
      `INSERT INTO spend_records (
        id, property_id, category, description, supplier, amount_pence,
        entry_date, kind, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      record.id,
      propertyId,
      record.category,
      record.description,
      record.supplier,
      record.amountPence,
      record.entryDate,
      record.kind,
      record.status,
      record.createdAt,
    )
    .run();

  return record;
}
