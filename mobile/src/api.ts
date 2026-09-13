export const apiBase = (
  process.env.EXPO_PUBLIC_ORIEL_API_URL ??
  'https://oriel-home-operations.palisandr.chatgpt.site'
).replace(/\/$/, '');

type ApiErrorPayload = { error?: unknown };

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  sessionToken?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (sessionToken) headers.set('Authorization', `Bearer ${sessionToken}`);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${apiBase}${path}`, { ...options, headers });
  const payload = (await response.json().catch(() => ({}))) as T &
    ApiErrorPayload;
  if (!response.ok) {
    throw new ApiError(
      typeof payload.error === 'string'
        ? payload.error
        : 'Oriel could not complete that request.',
      response.status,
    );
  }
  return payload;
}

export type W3dsOffer = {
  uri: string;
  session: string;
  clientProof: string;
  expiresAt: string;
};

export type W3dsCompletion =
  | { state: 'pending' }
  | { state: 'complete'; sessionToken: string; expiresAt: string };

export type Property = {
  id: string;
  name: string;
  area: string;
  currency: string;
  timezone: string;
};

export type HomeAssistantConnection = {
  connected: boolean;
  instanceHost: string | null;
  electricityEntityId: string | null;
  waterEntityId: string | null;
  updatedAt: string | null;
};

export type UtilityState = {
  status:
    | 'connected'
    | 'not_configured'
    | 'unreachable'
    | 'unauthorized'
    | 'entity_not_found'
    | 'invalid_response';
  utility: 'electricity' | 'water';
  entityId: string | null;
  value: string | null;
  unit: string | null;
  label: string | null;
  lastChanged: string | null;
  detail: string;
};

export const orielApi = {
  startW3dsSignIn: () => request<W3dsOffer>('/api/auth/offer?client=native'),
  completeW3dsSignIn: (session: string, clientProof: string) =>
    request<W3dsCompletion>(
      `/api/auth/complete?client=native&session=${encodeURIComponent(session)}`,
      { headers: { 'X-Oriel-Auth-Proof': clientProof } },
    ),
  properties: (sessionToken: string) =>
    request<{ properties: Property[] }>('/api/properties', {}, sessionToken),
  connection: (sessionToken: string) =>
    request<HomeAssistantConnection>(
      '/api/home-assistant/connection',
      {},
      sessionToken,
    ),
  utility: (sessionToken: string, utility: UtilityState['utility']) =>
    request<UtilityState>(
      `/api/home-assistant/utility/${utility}`,
      {},
      sessionToken,
    ),
  startHomeAssistant: (
    sessionToken: string,
    values: {
      instanceUrl: string;
      electricityEntityId: string;
      waterEntityId: string;
    },
  ) =>
    request<{ authorizeUrl: string }>(
      '/api/home-assistant/authorize',
      { method: 'POST', body: JSON.stringify({ ...values, native: true }) },
      sessionToken,
    ),
  completeHomeAssistant: (sessionToken: string, code: string, state: string) =>
    request<{ connected: true }>(
      '/api/home-assistant/complete',
      { method: 'POST', body: JSON.stringify({ code, state }) },
      sessionToken,
    ),
  disconnectHomeAssistant: (sessionToken: string) =>
    request<{ disconnected: true }>(
      '/api/home-assistant/connection',
      { method: 'DELETE' },
      sessionToken,
    ),
};
