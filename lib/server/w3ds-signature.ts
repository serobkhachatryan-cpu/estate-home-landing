import { createLocalJWKSet, jwtVerify } from 'jose';
import { base58btc } from 'multiformats/bases/base58';

type VerifyW3dsSessionSignatureInput = {
  eName: string;
  signature: string;
  session: string;
  registryBaseUrl: string;
};

export type W3dsVerificationFailure =
  | 'registry_resolution'
  | 'evault_lookup'
  | 'registry_certificates'
  | 'signature_decoding'
  | 'certificate_validation'
  | 'public_key_import'
  | 'signature_verification';

export type W3dsSignatureVerificationResult =
  | { valid: true }
  | { valid: false; failure: W3dsVerificationFailure };

function verificationFailure(
  failure: W3dsVerificationFailure,
): W3dsSignatureVerificationResult {
  return { valid: false, failure };
}

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

function decodePublicKey(value: string) {
  if (value.startsWith('z')) {
    // The current eVault can prefix hexadecimal SPKI DER bytes with `z`.
    // Prefer that legacy form when it is unambiguous, then fall back to the
    // standard base58btc multibase representation.
    if (/^[0-9a-f]+$/i.test(value.slice(1)) && value.length % 2 === 1) {
      return decodeHex(value.slice(1));
    }

    try {
      return base58btc.decode(value);
    } catch {
      throw new Error('Invalid base58 public key.');
    }
  }
  if (value.startsWith('m')) return decodeBase64(value.slice(1));
  if (value.startsWith('f')) return decodeHex(value.slice(1));
  return decodeBase64(value);
}

function signatureCandidates(value: string) {
  const candidates: Uint8Array[] = [];
  const add = (bytes: Uint8Array) => {
    if (
      !candidates.some(
        (candidate) =>
          candidate.length === bytes.length &&
          candidate.every((byte, index) => byte === bytes[index]),
      )
    ) {
      candidates.push(bytes);
    }
  };

  // W3DS Wallet versions have emitted both ordinary base64 and multibase
  // base58 signatures. A value starting with `z` can also be valid base64, so
  // retain every valid decoding and let signature verification select it.
  if (/^[A-Za-z0-9+/_-]+={0,2}$/.test(value)) {
    try {
      add(decodeBase64(value));
    } catch {
      // Try the other protocol encodings below.
    }
  }
  if (value.startsWith('z')) {
    try {
      add(base58btc.decode(value));
    } catch {
      // A malformed base58 value is not accepted unless another encoding is.
    }
  }
  if (value.startsWith('m')) {
    try {
      add(decodeBase64(value.slice(1)));
    } catch {
      // A malformed multibase value is not accepted unless another encoding is.
    }
  }
  if (value.startsWith('f')) {
    try {
      add(decodeHex(value.slice(1)));
    } catch {
      // A malformed multibase value is not accepted unless another encoding is.
    }
  }

  if (candidates.length === 0) throw new Error('Invalid signature encoding.');
  return candidates.map(decodeDerSignature);
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
  let stage: W3dsVerificationFailure = 'registry_resolution';
  try {
    const registryUrl = new URL(registryBaseUrl);
    const resolveUrl = new URL('/resolve', registryUrl);
    resolveUrl.searchParams.set('w3id', eName);

    const resolved = (await fetchJson(resolveUrl.toString())) as {
      uri?: unknown;
    };
    if (typeof resolved.uri !== 'string') {
      return verificationFailure(stage);
    }

    stage = 'evault_lookup';
    const whoisUrl = new URL('/whois', resolved.uri);
    const whois = (await fetchJson(whoisUrl.toString(), {
      headers: { Accept: 'application/json', 'X-ENAME': eName },
    })) as { keyBindingCertificates?: unknown };
    const certificates = whois.keyBindingCertificates;
    if (!Array.isArray(certificates) || certificates.length === 0) {
      return verificationFailure(stage);
    }

    stage = 'registry_certificates';
    const jwksUrl = new URL('/.well-known/jwks.json', registryUrl);
    const jwks = createLocalJWKSet(
      (await fetchJson(jwksUrl.toString())) as Parameters<
        typeof createLocalJWKSet
      >[0],
    );
    stage = 'signature_decoding';
    const signatures = signatureCandidates(signature);
    const sessionBytes = new TextEncoder().encode(session);
    let certificateWasValid = false;
    let keyWasImported = false;

    for (const certificate of certificates) {
      if (typeof certificate !== 'string') continue;

      try {
        stage = 'certificate_validation';
        const { payload } = await jwtVerify(certificate, jwks);
        if (payload.ename !== eName || typeof payload.publicKey !== 'string') {
          continue;
        }
        certificateWasValid = true;

        stage = 'public_key_import';
        const publicKeyBytes = decodePublicKey(payload.publicKey);
        const publicKey = await crypto.subtle.importKey(
          isRawP256PublicKey(publicKeyBytes) ? 'raw' : 'spki',
          publicKeyBytes,
          { name: 'ECDSA', namedCurve: 'P-256' },
          false,
          ['verify'],
        );
        keyWasImported = true;

        stage = 'signature_verification';
        for (const signatureBytes of signatures) {
          const valid = await crypto.subtle.verify(
            { name: 'ECDSA', hash: 'SHA-256' },
            publicKey,
            cryptoBuffer(signatureBytes),
            sessionBytes,
          );
          if (valid) return { valid: true };
        }
      } catch {
        // A user can have multiple device certificates. Try the next one.
      }
    }

    const finalStage: W3dsVerificationFailure = keyWasImported
      ? 'signature_verification'
      : certificateWasValid
        ? 'public_key_import'
        : 'certificate_validation';
    return verificationFailure(finalStage);
  } catch {
    return verificationFailure(stage);
  }
}
