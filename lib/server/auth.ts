import { headers } from 'next/headers';

import {
  getW3dsSessionEname,
  w3dsSessionCookieName,
} from '@/lib/server/w3ds-auth';
import { localDevelopmentViewerEName } from '@/lib/server/local-development';

export type AuthenticatedViewer = {
  id: string;
  eName: string;
  displayName: string;
};

function readCookie(header: string | null, name: string) {
  if (!header) return null;
  const prefix = `${name}=`;
  for (const part of header.split(';')) {
    const value = part.trim();
    if (value.startsWith(prefix)) return value.slice(prefix.length);
  }
  return null;
}

function readBearerToken(header: string | null) {
  const match = header?.match(/^Bearer\s+([^\s]+)$/i);
  return match?.[1] ?? null;
}

/**
 * A viewer is established only after Oriel has verified their eID Wallet's
 * W3DS signature and issued an HttpOnly, server-stored session token.
 */
export async function getAuthenticatedViewer(): Promise<AuthenticatedViewer | null> {
  const requestHeaders = await headers();
  const eName = await getW3dsSessionEname(
    readBearerToken(requestHeaders.get('authorization')) ??
      readCookie(requestHeaders.get('cookie'), w3dsSessionCookieName()),
  );
  if (eName) return { id: eName, eName, displayName: eName };

  const localEName = localDevelopmentViewerEName(requestHeaders.get('host'));
  if (!localEName) return null;

  return {
    id: localEName,
    eName: localEName,
    displayName: 'Oriel local administrator',
  };
}
