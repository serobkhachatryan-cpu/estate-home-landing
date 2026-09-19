import { env } from 'cloudflare:workers';

import { createInvestorShare } from '@/lib/server/investor-share';
import { parseSensorHistoryImport } from '@/lib/server/sensor-history-import';
import { replaceImportedSensorHistory } from '@/lib/server/sensor-history';

function sameSecret(received: string | null, expected: string | undefined) {
  if (!received || !expected || received.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= received.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}

function importSecret(request: Request) {
  const match = request.headers
    .get('authorization')
    ?.match(/^Bearer\s+([^\s]{24,256})$/i);
  return match?.[1] ?? null;
}

function limitedText(value: unknown, label: string, maximum: number) {
  if (typeof value !== 'string') throw new Error(`${label} is required.`);
  const text = value.trim();
  if (!text || text.length > maximum) throw new Error(`${label} is invalid.`);
  return text;
}

function ownerEName(value: unknown) {
  const result = limitedText(value, 'Snapshot owner', 120);
  if (!/^[a-z0-9_:@.-]+$/i.test(result)) {
    throw new Error('Snapshot owner is invalid.');
  }
  return result;
}

function shareHash(value: unknown) {
  const result = limitedText(value, 'Share digest', 64);
  if (!/^[a-f0-9]{64}$/i.test(result)) {
    throw new Error('Share digest is invalid.');
  }
  return result.toLowerCase();
}

function expiry(value: unknown) {
  if (value == null) return null;
  const result = limitedText(value, 'Share expiry', 64);
  const date = new Date(result);
  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
    throw new Error('Share expiry is invalid.');
  }
  return date.toISOString();
}

/**
 * A deployment-only ingestion gate. It accepts only normalized daily sensor
 * values in small batches; raw Home Assistant data and credentials are not a
 * valid request shape. It is unavailable without the hosted secret.
 */
export async function POST(request: Request) {
  const configured = (env as { ORIEL_INVESTOR_IMPORT_TOKEN?: string })
    .ORIEL_INVESTOR_IMPORT_TOKEN;
  if (!sameSecret(importSecret(request), configured)) {
    return new Response(null, { status: 404 });
  }

  try {
    const payload: unknown = await request.json();
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('Snapshot payload is invalid.');
    }
    const body = payload as Record<string, unknown>;
    const operation = body.operation;

    if (operation === 'replace_sources') {
      const sources = parseSensorHistoryImport(body);
      await replaceImportedSensorHistory(ownerEName(body.ownerEName), sources);
      return Response.json(
        {
          status: 'imported',
          sourceCount: sources.length,
          dailyPointCount: sources.reduce(
            (count, source) => count + source.daily.length,
            0,
          ),
        },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    if (operation === 'publish_share') {
      await createInvestorShare({
        ownerEName: ownerEName(body.ownerEName),
        shareHash: shareHash(body.shareHash),
        label: limitedText(body.label, 'Share label', 160),
        expiresAt: expiry(body.expiresAt),
      });
      return Response.json(
        { status: 'published' },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    throw new Error('Snapshot operation is invalid.');
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'The investor snapshot could not be processed.',
      },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
