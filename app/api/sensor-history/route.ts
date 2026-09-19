import { getAuthenticatedViewer } from '@/lib/server/auth';
import { getImportedSensorOverview } from '@/lib/server/sensor-history';

export async function GET(request: Request) {
  const viewer = await getAuthenticatedViewer();
  if (!viewer) {
    return Response.json(
      { error: 'Sign in with your W3DS eID to read sensor history.' },
      { status: 401 },
    );
  }

  const group = new URL(request.url).searchParams.get('group')?.trim();
  const history = await getImportedSensorOverview(
    viewer.eName,
    group || undefined,
  );
  return Response.json(history, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
