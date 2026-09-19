import { getAuthenticatedViewer } from '@/lib/server/auth';
import { getImportedSensorHistory } from '@/lib/server/sensor-history';

type RouteContext = {
  params: Promise<{ entityId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const viewer = await getAuthenticatedViewer();
  if (!viewer) {
    return Response.json(
      { error: 'Sign in with your W3DS eID to read sensor history.' },
      { status: 401 },
    );
  }

  const { entityId } = await context.params;
  if (!entityId || entityId.length > 255) {
    return Response.json({ error: 'Unknown sensor.' }, { status: 404 });
  }
  const history = await getImportedSensorHistory(viewer.eName, entityId);
  return Response.json(history, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
