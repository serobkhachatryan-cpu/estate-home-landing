import { database, ensureSchema } from '@/lib/server/database';

type InvestorShareRow = {
  owner_ename: string;
  label: string;
  expires_at: string | null;
  revoked_at: string | null;
};

export type InvestorShare = {
  ownerEName: string;
  label: string;
  expiresAt: string | null;
};

function toHex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashInvestorShareSecret(secret: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(secret),
  );
  return toHex(digest);
}

function bearerSecret(request: Request) {
  const value = request.headers.get('authorization');
  const match = value?.match(/^Bearer\s+([A-Za-z0-9_-]{32,128})$/i);
  return match?.[1] ?? null;
}

/**
 * The URL fragment is never sent to the server automatically. The browser
 * sends its opaque value here in an Authorization header, and D1 compares
 * only a digest of that value.
 */
export async function getInvestorShareForRequest(
  request: Request,
): Promise<InvestorShare | null> {
  const secret = bearerSecret(request);
  if (!secret) return null;

  await ensureSchema();
  const row = await database()
    .prepare(
      `SELECT owner_ename, label, expires_at, revoked_at
       FROM investor_shares
       WHERE share_hash = ?
       LIMIT 1`,
    )
    .bind(await hashInvestorShareSecret(secret))
    .first<InvestorShareRow>();
  if (!row || row.revoked_at) return null;
  if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) {
    return null;
  }

  return {
    ownerEName: row.owner_ename,
    label: row.label,
    expiresAt: row.expires_at,
  };
}

export async function createInvestorShare({
  ownerEName,
  shareHash,
  label,
  expiresAt,
}: {
  ownerEName: string;
  shareHash: string;
  label: string;
  expiresAt: string | null;
}) {
  await ensureSchema();
  const now = new Date().toISOString();
  await database()
    .prepare(
      `INSERT INTO investor_shares (
        share_hash, owner_ename, label, expires_at, revoked_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, NULL, ?, ?)
      ON CONFLICT(share_hash) DO UPDATE SET
        owner_ename = excluded.owner_ename,
        label = excluded.label,
        expires_at = excluded.expires_at,
        revoked_at = NULL,
        updated_at = excluded.updated_at`,
    )
    .bind(shareHash, ownerEName, label, expiresAt, now, now)
    .run();
}
