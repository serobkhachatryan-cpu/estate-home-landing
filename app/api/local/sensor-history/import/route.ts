import { getAuthenticatedViewer } from '@/lib/server/auth';
import { isLocalOrielImportRequest } from '@/lib/server/local-development';
import { parseSensorHistoryImport } from '@/lib/server/sensor-history-import';
import {
  replaceImportedSensorHistory,
} from '@/lib/server/sensor-history';

/**
 * Local-only ingestion endpoint for normalized historic sensor statistics.
 * It cannot receive a backup file, raw state history, or Home Assistant
 * credentials, and returns 404 outside the exact loopback developer profile.
 */
export async function POST(request: Request) {
  if (!isLocalOrielImportRequest(request)) {
    return new Response(null, { status: 404 });
  }

  const viewer = await getAuthenticatedViewer();
  if (!viewer) return new Response(null, { status: 404 });

  try {
    const sources = parseSensorHistoryImport(await request.json());
    await replaceImportedSensorHistory(viewer.eName, sources);
    return Response.json(
      {
        status: 'imported',
        sourceCount: sources.length,
        dailyPointCount: sources.reduce(
          (count, source) => count + source.daily.length,
          0,
        ),
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'The historical sensor import could not be processed.',
      },
      { status: 400, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }
}
