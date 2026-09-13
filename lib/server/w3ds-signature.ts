import { createLocalJWKSet, jwtVerify } from 'jose';
import { base58btc } from 'multiformats/bases/base58';

type VerifyW3dsSessionSignatureInput = {
  eName: string;
  signature: string;
  session: string;
  registryBaseUrl: string;
};

function decodeBase64(value: string) {
  if (!/^[A-Za-z0-9+/_-]*={0,2}$/.test(value)) {
    throw new Error('Invalid base64 value.');
  }

  const padded =
    value.length % 4 === 0 ? value : value + '='.repeat(4 - (value.length % 4));
  const binary = atob(padded.replaceAll('-', '+').replaceAll('_', '/'));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function decodeHex(value: string) {
  if (!/^[0-9a-f]+$/i.test(value) || value.length % 2 !== 0) {
    throw new Error('Invalid hexadecimal value.');
  }

  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < value.length; index += 2) {
    bytes[index / 2] = Number.parseInt(value.slice(index, index + 2), 16);
  }
  return bytes;
}

function decodeMultibase(value: string) {
  if (value.startsWith('z')) return base58btc.decode(value);
  if (value.startsWith('m')) return decodeBase64(value.slice(1));
  if (value.startsWith('f')) return decodeHex(value.slice(1));
  return decodeBase64(value);
}

function cryptoBuffer(value: Uint8Array) {
  const copy = new Uint8Array(value.byteLength);
  copy.set(value);
  return copy;
}

function isRawP256PublicKey(value: Uint8Array) {
  return value.length === 65 && value[0] === 0x04;
}

function readDerLength(bytes: Uint8Array, offset: number) {
  const first = bytes[offset];
  if (first === undefined) throw new Error('Invalid DER value.');
  if (first < 0x80) return { length: first, next: offset + 1 };

  const lengthBytes = first & 0x7f;
  if (lengthBytes === 0 || lengthBytes > 2) {
    throw new Error('Unsupported DER length.');
  }

  let length = 0;
  for (let index = 0; index < lengthBytes; index += 1) {
    const byte = bytes[offset + 1 + index];
    if (byte === undefined) throw new Error('Invalid DER length.');
    length = (length << 8) | byte;
  }

  return { length, next: offset + 1 + lengthBytes };
}

function decodeDerSignature(bytes: Uint8Array) {
  if (bytes[0] !== 0x30) return bytes;

  const sequence = readDerLength(bytes, 1);
  if (sequence.next + sequence.length !== bytes.length) {
    throw new Error('Invalid DER signature.');
  }

  let offset = sequence.next;
  const readInteger = () => {
    if (bytes[offset] !== 0x02) throw new Error('Invalid DER signature.');
    const integer = readDerLength(bytes, offset + 1);
    const start = integer.next;
    const end = start + integer.length;
    if (end > bytes.length || integer.length === 0) {
      throw new Error('Invalid DER signature.');
    }
    offset = end;
    const value = bytes.slice(start, end);
    const trimmed = value[0] === 0 ? value.slice(1) : value;
    if (trimmed.length > 32) throw new Error('Invalid DER signature.');
    const padded = new Uint8Array(32);
    padded.set(trimmed, 32 - trimmed.length);
    return padded;
  };

  const r = readInteger();
  const s = readInteger();
  if (offset !== bytes.length) throw new Error('Invalid DER signature.');

  const raw = new Uint8Array(64);
  raw.set(r, 0);
  raw.set(s, 32);
  return raw;
}

async function fetchJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error('W3DS verification request failed.');
  return response.json() as Promise<unknown>;
}

/**
 * Verifies the W3DS auth protocol without trusting a client-provided key.
 * The eVault URL is resolved from the Registry for every login, and the
 * eVault request is scoped to the presented eName.
 */
export async function verifyW3dsSessionSignature({
  eName,
  signature,
  session,
  registryBaseUrl,
}: VerifyW3dsSessionSignatureInput) {
  try {
    const registryUrl = new URL(registryBaseUrl);
    const resolveUrl = new URL('/resolve', registryUrl);
    resolveUrl.searchParams.set('w3id', eName);

    const resolved = (await fetchJson(resolveUrl.toString())) as {
      uri?: unknown;
    };
    if (typeof resolved.uri !== 'string') return false;

    const whoisUrl = new URL('/whois', resolved.uri);
    const whois = (await fetchJson(whoisUrl.toString(), {
      headers: { Accept: 'application/json', 'X-ENAME': eName },
    })) as { keyBindingCertificates?: unknown };
    const certificates = whois.keyBindingCertificates;
    if (!Array.isArray(certificates) || certificates.length === 0) return false;

    const jwksUrl = new URL('/.well-known/jwks.json', registryUrl);
    const jwks = createLocalJWKSet(
      (await fetchJson(jwksUrl.toString())) as Parameters<
        typeof createLocalJWKSet
      >[0],
    );
    const signatureBytes = decodeDerSignature(decodeMultibase(signature));
    const sessionBytes = new TextEncoder().encode(session);

    for (const certificate of certificates) {
      if (typeof certificate !== 'string') continue;

      try {
        const { payload } = await jwtVerify(certificate, jwks);
        if (payload.ename !== eName || typeof payload.publicKey !== 'string') {
          continue;
        }

        const publicKeyBytes = decodeMultibase(payload.publicKey);
        const publicKey = await crypto.subtle.importKey(
          isRawP256PublicKey(publicKeyBytes) ? 'raw' : 'spki',
          publicKeyBytes,
          { name: 'ECDSA', namedCurve: 'P-256' },
          false,
          ['verify'],
        );
        const valid = await crypto.subtle.verify(
          { name: 'ECDSA', hash: 'SHA-256' },
          publicKey,
          cryptoBuffer(signatureBytes),
          sessionBytes,
        );
        if (valid) return true;
      } catch {
        // A user can have multiple device certificates. Try the next one.
      }
    }
  } catch {
    // The callback always receives a generic invalid-signature result.
  }

  return false;
}
