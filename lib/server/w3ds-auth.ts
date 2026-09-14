import { env } from 'cloudflare:workers';

import { database, ensureSchema } from '@/lib/server/database';
import { verifyW3dsSessionSignature } from '@/lib/server/w3ds-signature';

const ATTEMPT_COOKIE = 'oriel_w3ds_attempt';
const SESSION_COOKIE = 'oriel_w3ds_session';
const OFFER_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_REGISTRY_URL = 'https://registry.w3ds.metastate.foundation';

type AuthOfferRow = {
  session_id: string;
  browser_proof_hash: string;
  return_to: string;
  expires_at: string;
  completed_ename: string | null;
  completed_at: string | null;
  claimed_at: string | null;
};

function appEnvironment() {
  return env as Record<string, string | undefined>;
}

function readCookie(header: string | null, name: string) {
  if (!header) return null;
  const prefix = `${name}=`;
  for (const part of header.split(';')) {
    const value = part.trim();
    if (value.startsWith(prefix)) return value.slice(prefix.length);
  }
  return null;
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

async function hashToken(value: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/app/properties';
  }
  return value;
}

function configuredPublicOrigin(request: Request) {
  const configured = appEnvironment().ORIEL_PUBLIC_BASE_URL?.trim();
  if (configured) return new URL(configured).origin;

  const requestUrl = new URL(request.url);
  if (
    requestUrl.hostname === 'localhost' ||
    requestUrl.hostname === '127.0.0.1' ||
    requestUrl.hostname === '[::1]'
  ) {
    return requestUrl.origin;
  }

  throw new Error('W3DS sign-in is not configured for this public origin.');
}

function registryBaseUrl() {
  const configured = appEnvironment().W3DS_REGISTRY_URL?.trim();
  return new URL(configured || DEFAULT_REGISTRY_URL).origin;
}

function setCookie(
  name: string,
  value: string,
  maxAgeSeconds: number,
  origin: string,
) {
  const parts = [
    `${name}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (new URL(origin).protocol === 'https:') parts.push('Secure');
  return parts.join('; ');
}

function isW3dsId(value: string) {
  return value.startsWith('@') && value.length <= 240 && !/[\r\n]/.test(value);
}

export type W3dsAuthOffer = {
  uri: string;
  session: string;
  expiresAt: string;
  returnTo: string;
  attemptCookie: string;
  clientProof: string;
};

export async function createW3dsAuthOffer(
  request: Request,
  { native = false }: { native?: boolean } = {},
): Promise<W3dsAuthOffer> {
  await ensureSchema();
  const origin = configuredPublicOrigin(request);
  const returnTo = safeReturnTo(
    new URL(request.url).searchParams.get('return_to'),
  );
  const session = crypto.randomUUID();
  const browserProof = randomToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OFFER_TTL_MS);

  await database()
    .prepare(
      `INSERT INTO w3ds_auth_offers
       (session_id, browser_proof_hash, return_to, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(
      session,
      await hashToken(browserProof),
      returnTo,
      expiresAt.toISOString(),
      now.toISOString(),
    )
    .run();

  const callbackUrl = new URL('/api/auth', origin).toString();
  const params = new URLSearchParams({
    redirect: callbackUrl,
    session,
    platform: 'Oriel',
  });

  return {
    uri: `w3ds://auth?${params.toString()}`,
    session,
    expiresAt: expiresAt.toISOString(),
    returnTo,
    attemptCookie: setCookie(
      ATTEMPT_COOKIE,
      browserProof,
      Math.floor(OFFER_TTL_MS / 1000),
      origin,
    ),
    // The proof is returned only by the native API route. It binds the device
    // that opened the W3DS request to the later polling request.
    clientProof: native ? browserProof : '',
  };
}

export async function receiveW3dsAuthCallback(input: unknown) {
  if (!input || typeof input !== 'object')
    return { ok: false as const, status: 400 };

  const body = input as Record<string, unknown>;
  const w3id = typeof body.w3id === 'string' ? body.w3id : '';
  const session = typeof body.session === 'string' ? body.session : '';
  const signature = typeof body.signature === 'string' ? body.signature : '';
  if (!isW3dsId(w3id) || !session || !signature) {
    return { ok: false as const, status: 400 };
  }

  await ensureSchema();
  const now = new Date().toISOString();
  const offer = await database()
    .prepare(
      `SELECT session_id, browser_proof_hash, return_to, expires_at,
        completed_ename, completed_at, claimed_at
       FROM w3ds_auth_offers WHERE session_id = ? LIMIT 1`,
    )
    .bind(session)
    .first<AuthOfferRow>();
  if (
    !offer ||
    offer.completed_at ||
    new Date(offer.expires_at).getTime() <= Date.now()
  ) {
    return { ok: false as const, status: 401 };
  }

  const verification = await verifyW3dsSessionSignature({
    eName: w3id,
    signature,
    session,
    registryBaseUrl: registryBaseUrl(),
  });
  if (!verification.valid) {
    // This records only a fixed integration stage, never an eName, session,
    // signature, certificate, or URL. It makes hosted-wallet failures
    // diagnosable without weakening W3DS authentication.
    await database()
      .prepare(
        `UPDATE w3ds_auth_offers SET failure_code = ?
         WHERE session_id = ? AND completed_at IS NULL`,
      )
      .bind(verification.failure, session)
      .run();
    return { ok: false as const, status: 401 };
  }

  const result = await database()
    .prepare(
      `UPDATE w3ds_auth_offers
       SET completed_ename = ?, completed_at = ?, failure_code = NULL
       WHERE session_id = ? AND completed_at IS NULL AND expires_at > ?`,
    )
    .bind(w3id, now, session, now)
    .run();
  if ((result.meta.changes ?? 0) !== 1) {
    return { ok: false as const, status: 401 };
  }

  return { ok: true as const };
}

type AuthCompletion =
  | { state: 'pending' }
  | { state: 'invalid' }
  | {
      state: 'complete';
      sessionToken: string;
      expiresAt: string;
      returnTo: string;
      origin: string;
    };

type NativeAuthCompletion =
  | { state: 'pending' }
  | { state: 'invalid' }
  | {
      state: 'complete';
      sessionToken: string;
      expiresAt: string;
      returnTo: string;
    };

async function claimCompletedW3dsOffer(
  session: string | null,
  clientProof: string | null,
): Promise<NativeAuthCompletion> {
  if (!session || !clientProof) return { state: 'invalid' };

  await ensureSchema();
  const offer = await database()
    .prepare(
      `SELECT session_id, browser_proof_hash, return_to, expires_at,
        completed_ename, completed_at, claimed_at
       FROM w3ds_auth_offers WHERE session_id = ? LIMIT 1`,
    )
    .bind(session)
    .first<AuthOfferRow>();
  if (
    !offer ||
    offer.browser_proof_hash !== (await hashToken(clientProof)) ||
    new Date(offer.expires_at).getTime() <= Date.now() ||
    offer.claimed_at
  ) {
    return { state: 'invalid' };
  }
  if (!offer.completed_ename || !offer.completed_at) {
    return { state: 'pending' };
  }

  const now = new Date();
  const claim = await database()
    .prepare(
      `UPDATE w3ds_auth_offers SET claimed_at = ?
       WHERE session_id = ? AND claimed_at IS NULL`,
    )
    .bind(now.toISOString(), session)
    .run();
  if ((claim.meta.changes ?? 0) !== 1) return { state: 'invalid' };

  const sessionToken = randomToken();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS).toISOString();
  await database()
    .prepare(
      `INSERT INTO w3ds_auth_sessions (token_hash, ename, expires_at, created_at)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(
      await hashToken(sessionToken),
      offer.completed_ename,
      expiresAt,
      now.toISOString(),
    )
    .run();

  return {
    state: 'complete',
    sessionToken,
    expiresAt,
    returnTo: offer.return_to,
  };
}

export async function completeW3dsBrowserSignIn(
  request: Request,
  session: string | null,
): Promise<AuthCompletion> {
  const browserProof = readCookie(
    request.headers.get('cookie'),
    ATTEMPT_COOKIE,
  );
  const result = await claimCompletedW3dsOffer(session, browserProof);
  if (result.state !== 'complete') return result;

  return {
    state: 'complete',
    sessionToken: result.sessionToken,
    expiresAt: result.expiresAt,
    returnTo: result.returnTo,
    origin: configuredPublicOrigin(request),
  };
}

/**
 * Native clients keep their own short-lived attempt proof in encrypted device
 * storage because HttpOnly browser cookies are unavailable to an iOS app.
 */
export function completeW3dsNativeSignIn(
  session: string | null,
  clientProof: string | null,
) {
  return claimCompletedW3dsOffer(session, clientProof);
}

export async function getW3dsSessionEname(sessionToken: string | null) {
  if (!sessionToken) return null;

  await ensureSchema();
  const row = await database()
    .prepare(
      `SELECT ename FROM w3ds_auth_sessions
       WHERE token_hash = ? AND expires_at > ? LIMIT 1`,
    )
    .bind(await hashToken(sessionToken), new Date().toISOString())
    .first<{ ename: string }>();

  return row?.ename ?? null;
}

export function sessionCookieFor(
  sessionToken: string,
  expiresAt: string,
  origin: string,
) {
  const maxAge = Math.max(
    0,
    Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000),
  );
  return setCookie(SESSION_COOKIE, sessionToken, maxAge, origin);
}

export function w3dsSessionCookieName() {
  return SESSION_COOKIE;
}
