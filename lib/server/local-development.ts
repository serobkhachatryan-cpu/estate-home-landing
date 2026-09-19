import { env } from 'cloudflare:workers';

/**
 * Local development is intentionally narrow: it supports the single Home
 * Assistant OS VM that Oriel starts on this Mac. It is not a generic way to
 * make private addresses acceptable to a deployed worker.
 */
export const localOrielOrigin = 'http://127.0.0.1:3001';
export const localHomeAssistantOrigin = 'http://127.0.0.1:8125';

type LocalDevelopmentEnvironment = {
  ORIEL_LOCAL_DEV_MODE?: string;
  ORIEL_LOCAL_DEV_ENAME?: string;
  ORIEL_PUBLIC_BASE_URL?: string;
};

function appEnvironment() {
  return env as LocalDevelopmentEnvironment;
}

function isExactRootOrigin(value: string | undefined, origin: string) {
  if (!value) return false;
  try {
    const url = new URL(value.trim());
    return (
      url.origin === origin &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      (url.pathname === '' || url.pathname === '/')
    );
  } catch {
    return false;
  }
}

/**
 * This requires both an explicit opt-in and the exact loopback Oriel origin.
 * A deployed Oriel instance can never enable this mode by accident while it
 * is configured with its public HTTPS origin.
 */
export function isLocalOrielDevelopment() {
  const environment = appEnvironment();
  return (
    environment.ORIEL_LOCAL_DEV_MODE === '1' &&
    isExactRootOrigin(environment.ORIEL_PUBLIC_BASE_URL, localOrielOrigin)
  );
}

/**
 * A local-only profile makes it possible to exercise the Home Assistant flow
 * without weakening the deployed W3DS eID requirement. The local server is
 * bound to 127.0.0.1, so no other device can use this profile.
 */
export function localDevelopmentViewerEName(requestHost: string | null) {
  if (!isLocalOrielDevelopment() || requestHost !== '127.0.0.1:3001') {
    return null;
  }

  const value =
    appEnvironment().ORIEL_LOCAL_DEV_ENAME?.trim() ?? '@oriel-local-admin';
  return value.startsWith('@') && value.length <= 240 && !/[\r\n]/.test(value)
    ? value
    : null;
}

/**
 * The historical-backup importer is deliberately unavailable outside the
 * exact loopback development profile. It accepts only normalized readings;
 * Home Assistant backup files are never sent through an HTTP route.
 */
export function isLocalOrielImportRequest(request: Request) {
  if (!isLocalOrielDevelopment()) return false;

  try {
    const url = new URL(request.url);
    return (
      url.origin === localOrielOrigin &&
      request.headers.get('host') === '127.0.0.1:3001'
    );
  } catch {
    return false;
  }
}
