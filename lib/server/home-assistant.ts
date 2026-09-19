import { env } from 'cloudflare:workers';

import { database, ensureSchema } from '@/lib/server/database';
import {
  isLocalOrielDevelopment,
  localHomeAssistantOrigin,
  localOrielOrigin,
} from '@/lib/server/local-development';

export const homeAssistantUtilityKinds = ['electricity', 'water'] as const;

export type HomeAssistantUtilityKind =
  (typeof homeAssistantUtilityKinds)[number];

const OFFER_TTL_MS = 10 * 60 * 1000;
const ACCESS_TOKEN_SKEW_MS = 60 * 1000;

type HomeAssistantEnvironment = {
  HOME_ASSISTANT_TOKEN_ENCRYPTION_KEY?: string;
  ORIEL_PUBLIC_BASE_URL?: string;
};

type AuthOfferRow = {
  session_id: string;
  owner_ename: string;
  instance_url: string;
  electricity_entity_id: string;
  water_entity_id: string;
  expires_at: string;
  completed_at: string | null;
};

type ConnectionRow = {
  owner_ename: string;
  instance_url: string;
  client_id: string;
  electricity_entity_id: string;
  water_entity_id: string;
  access_token_encrypted: string;
  refresh_token_encrypted: string;
  access_token_expires_at: string;
  updated_at: string;
};

type HomeAssistantState = {
  entity_id?: unknown;
  state?: unknown;
  last_changed?: unknown;
  last_updated?: unknown;
  attributes?: unknown;
};

type HomeAssistantAttributes = Record<string, unknown>;

type TokenResponse = {
  access_token?: unknown;
  refresh_token?: unknown;
  expires_in?: unknown;
};

export type HomeAssistantConnectionSummary = {
  connected: boolean;
  instanceHost: string | null;
  electricityEntityId: string | null;
  waterEntityId: string | null;
  updatedAt: string | null;
};

export type HomeAssistantUtilityState = {
  status:
    | 'connected'
    | 'not_configured'
    | 'unreachable'
    | 'unauthorized'
    | 'entity_not_found'
    | 'invalid_response';
  utility: HomeAssistantUtilityKind;
  entityId: string | null;
  value: string | null;
  unit: string | null;
  label: string | null;
  lastChanged: string | null;
  detail: string;
};

export type HomeAssistantConnectInput = {
  instanceUrl: string;
  electricityEntityId: string;
  waterEntityId: string;
};

type HomeAssistantAuthOfferOptions = {
  nativeRedirect?: boolean;
};

function appEnvironment() {
  return env as HomeAssistantEnvironment;
}

function isPrivateHost(hostname: string) {
  const host = hostname.toLowerCase();
  return (
    host === 'localhost' ||
    host.endsWith('.local') ||
    host === '::1' ||
    host.startsWith('127.') ||
    host.startsWith('10.') ||
    host.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^fc[0-9a-f]{2}:/i.test(host) ||
    /^fd[0-9a-f]{2}:/i.test(host)
  );
}

function validatedInstanceUrl(value: string) {
  try {
    const url = new URL(value.trim());
    const isRootUrl =
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      (url.pathname === '' || url.pathname === '/');
    if (!isRootUrl) return null;

    if (isLocalOrielDevelopment() && url.origin === localHomeAssistantOrigin) {
      return url.origin;
    }

    if (url.protocol !== 'https:' || isPrivateHost(url.hostname)) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

function validEntityId(value: string) {
  const entityId = value.trim();
  return /^[a-z_]+\.[a-zA-Z0-9_]+$/.test(entityId) ? entityId : null;
}

function publicOrielOrigin() {
  const configured = appEnvironment().ORIEL_PUBLIC_BASE_URL?.trim();
  if (!configured) return null;

  try {
    const url = new URL(configured);
    const isRootUrl =
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      (url.pathname === '' || url.pathname === '/');
    if (!isRootUrl) return null;

    if (isLocalOrielDevelopment() && url.origin === localOrielOrigin) {
      return url.origin;
    }

    if (url.protocol !== 'https:') return null;
    return url.origin;
  } catch {
    return null;
  }
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function attributes(value: unknown): HomeAssistantAttributes {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as HomeAssistantAttributes)
    : {};
}

function base64UrlEncode(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

function base64UrlDecode(value: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Invalid secret value.');
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

async function encryptionKey() {
  const raw = appEnvironment().HOME_ASSISTANT_TOKEN_ENCRYPTION_KEY?.trim();
  if (!raw)
    throw new Error('Home Assistant credential storage is not configured.');
  const bytes = base64UrlDecode(raw);
  if (bytes.length !== 32) {
    throw new Error('Home Assistant credential storage is not configured.');
  }
  return crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, [
    'encrypt',
    'decrypt',
  ]);
}

async function encryptSecret(value: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await encryptionKey(),
    new TextEncoder().encode(value),
  );
  return `${base64UrlEncode(iv)}.${base64UrlEncode(new Uint8Array(ciphertext))}`;
}

async function decryptSecret(value: string) {
  const [encodedIv, encodedCiphertext] = value.split('.');
  if (!encodedIv || !encodedCiphertext)
    throw new Error('Invalid encrypted secret.');
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64UrlDecode(encodedIv) },
    await encryptionKey(),
    base64UrlDecode(encodedCiphertext),
  );
  return new TextDecoder().decode(plaintext);
}

function expiresAt(expiresIn: unknown) {
  const seconds =
    typeof expiresIn === 'number' && Number.isFinite(expiresIn)
      ? Math.max(60, Math.min(expiresIn, 24 * 60 * 60))
      : 30 * 60;
  return new Date(Date.now() + seconds * 1000).toISOString();
}

function utilityEntityId(
  connection: ConnectionRow,
  utility: HomeAssistantUtilityKind,
) {
  return utility === 'electricity'
    ? connection.electricity_entity_id
    : connection.water_entity_id;
}

function utilityResponse(
  utility: HomeAssistantUtilityKind,
  status: HomeAssistantUtilityState['status'],
  detail: string,
  entityId: string | null = null,
): HomeAssistantUtilityState {
  return {
    status,
    utility,
    entityId,
    value: null,
    unit: null,
    label: null,
    lastChanged: null,
    detail,
  };
}

async function postToken(
  instanceUrl: string,
  values: Record<string, string>,
): Promise<TokenResponse | null> {
  const body = new URLSearchParams(values);
  const timeout = new AbortController();
  const timeoutId = setTimeout(() => timeout.abort(), 8_000);
  try {
    const upstream = await fetch(new URL('/auth/token', instanceUrl), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
      // Workers does not implement redirect: 'error'. Manual mode also keeps
      // OAuth/token requests from following an unexpected upstream redirect.
      redirect: 'manual',
      signal: timeout.signal,
    });
    if (!upstream.ok) return null;
    return (await upstream.json()) as TokenResponse;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Removing a connection must always remove Oriel's encrypted copy, even when
 * Home Assistant is offline. When it is reachable, revoke the refresh token
 * as well so the upstream authorization ends immediately.
 */
async function revokeRefreshToken(instanceUrl: string, refreshToken: string) {
  const timeout = new AbortController();
  const timeoutId = setTimeout(() => timeout.abort(), 8_000);
  try {
    await fetch(new URL('/auth/revoke', instanceUrl), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ token: refreshToken }),
      redirect: 'manual',
      signal: timeout.signal,
    });
  } catch {
    // The local encrypted copy still gets deleted below. A user can also
    // revoke an unreachable instance's authorization from Home Assistant.
  } finally {
    clearTimeout(timeoutId);
  }
}

async function activeAccessToken(connection: ConnectionRow) {
  if (
    new Date(connection.access_token_expires_at).getTime() >
    Date.now() + ACCESS_TOKEN_SKEW_MS
  ) {
    return decryptSecret(connection.access_token_encrypted);
  }

  const refreshToken = await decryptSecret(connection.refresh_token_encrypted);
  const token = await postToken(connection.instance_url, {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: connection.client_id,
  });
  const accessToken = stringValue(token?.access_token);
  if (!accessToken) throw new Error('Home Assistant token refresh failed.');

  const now = new Date();
  await database()
    .prepare(
      `UPDATE home_assistant_connections
       SET access_token_encrypted = ?, access_token_expires_at = ?, updated_at = ?
       WHERE owner_ename = ?`,
    )
    .bind(
      await encryptSecret(accessToken),
      expiresAt(token?.expires_in),
      now.toISOString(),
      connection.owner_ename,
    )
    .run();
  return accessToken;
}

export function isHomeAssistantUtilityKind(
  value: string,
): value is HomeAssistantUtilityKind {
  return (homeAssistantUtilityKinds as readonly string[]).includes(value);
}

export function validateHomeAssistantConnectInput(
  value: unknown,
): HomeAssistantConnectInput {
  if (!value || typeof value !== 'object') {
    throw new Error(
      'Enter your Home Assistant address and utility sensor IDs.',
    );
  }
  const input = value as Record<string, unknown>;
  const instanceUrl =
    typeof input.instanceUrl === 'string'
      ? validatedInstanceUrl(input.instanceUrl)
      : null;
  const electricityEntityId =
    typeof input.electricityEntityId === 'string'
      ? validEntityId(input.electricityEntityId)
      : null;
  const waterEntityId =
    typeof input.waterEntityId === 'string'
      ? validEntityId(input.waterEntityId)
      : null;

  if (!instanceUrl) {
    throw new Error(
      isLocalOrielDevelopment()
        ? 'Use the configured local Home Assistant address or a public HTTPS address.'
        : 'Use the public HTTPS address for Home Assistant.',
    );
  }
  if (!electricityEntityId || !waterEntityId) {
    throw new Error('Enter both sensor IDs in domain.object_id form.');
  }
  return { instanceUrl, electricityEntityId, waterEntityId };
}

export async function createHomeAssistantAuthOffer(
  ownerEname: string,
  input: HomeAssistantConnectInput,
  options: HomeAssistantAuthOfferOptions = {},
) {
  await ensureSchema();
  const clientId = publicOrielOrigin();
  if (!clientId) {
    throw new Error(
      'Home Assistant connection is not configured for this app origin.',
    );
  }

  const sessionId = crypto.randomUUID();
  const now = new Date();
  const expiry = new Date(now.getTime() + OFFER_TTL_MS);
  await database()
    .prepare(
      `INSERT INTO home_assistant_auth_offers
       (session_id, owner_ename, instance_url, electricity_entity_id,
        water_entity_id, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      sessionId,
      ownerEname,
      input.instanceUrl,
      input.electricityEntityId,
      input.waterEntityId,
      expiry.toISOString(),
      now.toISOString(),
    )
    .run();

  const callback = options.nativeRedirect
    ? 'oriel://home-assistant/callback'
    : new URL('/api/home-assistant/callback', clientId).toString();
  const authorizeUrl = new URL('/auth/authorize', input.instanceUrl);
  authorizeUrl.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callback,
    state: sessionId,
  }).toString();

  return { authorizeUrl: authorizeUrl.toString() };
}

export async function completeHomeAssistantAuth(
  ownerEname: string,
  code: string | null,
  sessionId: string | null,
) {
  if (!code || !sessionId) return false;
  await ensureSchema();

  const offer = await database()
    .prepare(
      `SELECT session_id, owner_ename, instance_url, electricity_entity_id,
        water_entity_id, expires_at, completed_at
       FROM home_assistant_auth_offers WHERE session_id = ? LIMIT 1`,
    )
    .bind(sessionId)
    .first<AuthOfferRow>();
  if (
    !offer ||
    offer.owner_ename !== ownerEname ||
    offer.completed_at ||
    new Date(offer.expires_at).getTime() <= Date.now()
  ) {
    return false;
  }

  const clientId = publicOrielOrigin();
  if (!clientId) return false;
  const token = await postToken(offer.instance_url, {
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
  });
  const accessToken = stringValue(token?.access_token);
  const refreshToken = stringValue(token?.refresh_token);
  if (!accessToken || !refreshToken) return false;

  try {
    const now = new Date();
    const result = await database()
      .prepare(
        `UPDATE home_assistant_auth_offers SET completed_at = ?
         WHERE session_id = ? AND completed_at IS NULL AND expires_at > ?`,
      )
      .bind(now.toISOString(), sessionId, now.toISOString())
      .run();
    if ((result.meta.changes ?? 0) !== 1) return false;

    await database()
      .prepare(
        `INSERT INTO home_assistant_connections
         (owner_ename, instance_url, client_id, electricity_entity_id,
          water_entity_id, access_token_encrypted, refresh_token_encrypted,
          access_token_expires_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(owner_ename) DO UPDATE SET
           instance_url = excluded.instance_url,
           client_id = excluded.client_id,
           electricity_entity_id = excluded.electricity_entity_id,
           water_entity_id = excluded.water_entity_id,
           access_token_encrypted = excluded.access_token_encrypted,
           refresh_token_encrypted = excluded.refresh_token_encrypted,
           access_token_expires_at = excluded.access_token_expires_at,
           updated_at = excluded.updated_at`,
      )
      .bind(
        ownerEname,
        offer.instance_url,
        clientId,
        offer.electricity_entity_id,
        offer.water_entity_id,
        await encryptSecret(accessToken),
        await encryptSecret(refreshToken),
        expiresAt(token?.expires_in),
        now.toISOString(),
        now.toISOString(),
      )
      .run();
    return true;
  } catch {
    return false;
  }
}

export async function getHomeAssistantConnectionSummary(
  ownerEname: string,
): Promise<HomeAssistantConnectionSummary> {
  await ensureSchema();
  const connection = await database()
    .prepare(
      `SELECT owner_ename, instance_url, client_id, electricity_entity_id,
        water_entity_id, access_token_encrypted, refresh_token_encrypted,
        access_token_expires_at, updated_at
       FROM home_assistant_connections WHERE owner_ename = ? LIMIT 1`,
    )
    .bind(ownerEname)
    .first<ConnectionRow>();
  if (!connection) {
    return {
      connected: false,
      instanceHost: null,
      electricityEntityId: null,
      waterEntityId: null,
      updatedAt: null,
    };
  }

  return {
    connected: true,
    instanceHost: new URL(connection.instance_url).host,
    electricityEntityId: connection.electricity_entity_id,
    waterEntityId: connection.water_entity_id,
    updatedAt: connection.updated_at,
  };
}

export async function disconnectHomeAssistant(ownerEname: string) {
  await ensureSchema();
  const connection = await database()
    .prepare(
      `SELECT owner_ename, instance_url, client_id, electricity_entity_id,
        water_entity_id, access_token_encrypted, refresh_token_encrypted,
        access_token_expires_at, updated_at
       FROM home_assistant_connections WHERE owner_ename = ? LIMIT 1`,
    )
    .bind(ownerEname)
    .first<ConnectionRow>();

  await database()
    .prepare('DELETE FROM home_assistant_connections WHERE owner_ename = ?')
    .bind(ownerEname)
    .run();

  if (connection) {
    try {
      await revokeRefreshToken(
        connection.instance_url,
        await decryptSecret(connection.refresh_token_encrypted),
      );
    } catch {
      // Decryption failure must not leave the local connection record behind.
    }
  }
}

/**
 * Retrieves exactly one configured Home Assistant sensor state. Oriel never
 * calls Home Assistant service endpoints, so the bridge cannot control devices.
 */
export async function getHomeAssistantUtilityState(
  ownerEname: string,
  utility: HomeAssistantUtilityKind,
): Promise<HomeAssistantUtilityState> {
  await ensureSchema();
  const connection = await database()
    .prepare(
      `SELECT owner_ename, instance_url, client_id, electricity_entity_id,
        water_entity_id, access_token_encrypted, refresh_token_encrypted,
        access_token_expires_at, updated_at
       FROM home_assistant_connections WHERE owner_ename = ? LIMIT 1`,
    )
    .bind(ownerEname)
    .first<ConnectionRow>();
  if (!connection) {
    return utilityResponse(
      utility,
      'not_configured',
      'Connect your Home Assistant utility unit in Settings.',
    );
  }

  const entityId = utilityEntityId(connection, utility);
  try {
    const accessToken = await activeAccessToken(connection);
    const timeout = new AbortController();
    const timeoutId = setTimeout(() => timeout.abort(), 8_000);
    try {
      const upstream = await fetch(
        new URL(
          `/api/states/${encodeURIComponent(entityId)}`,
          connection.instance_url,
        ),
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          redirect: 'manual',
          signal: timeout.signal,
        },
      );
      if (upstream.status === 401 || upstream.status === 403) {
        return utilityResponse(
          utility,
          'unauthorized',
          'Home Assistant authorization needs to be renewed.',
          entityId,
        );
      }
      if (upstream.status === 404) {
        return utilityResponse(
          utility,
          'entity_not_found',
          'The selected Home Assistant sensor was not found.',
          entityId,
        );
      }
      if (!upstream.ok) {
        return utilityResponse(
          utility,
          'unreachable',
          'Home Assistant did not return a utility reading.',
          entityId,
        );
      }

      const payload = (await upstream.json()) as HomeAssistantState;
      const state = stringValue(payload.state);
      if (!state) {
        return utilityResponse(
          utility,
          'invalid_response',
          'Home Assistant returned an unreadable utility state.',
          entityId,
        );
      }
      const stateAttributes = attributes(payload.attributes);
      return {
        status: 'connected',
        utility,
        entityId: stringValue(payload.entity_id) ?? entityId,
        value: state,
        unit: stringValue(stateAttributes.unit_of_measurement),
        label:
          stringValue(stateAttributes.friendly_name) ??
          (utility === 'electricity' ? 'Electricity sensor' : 'Water sensor'),
        lastChanged:
          stringValue(payload.last_updated) ??
          stringValue(payload.last_changed),
        detail: 'Live Home Assistant reading',
      };
    } finally {
      clearTimeout(timeoutId);
    }
  } catch {
    return utilityResponse(
      utility,
      'unreachable',
      'Oriel could not reach Home Assistant from this deployment.',
      entityId,
    );
  }
}
