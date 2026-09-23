import { getAuthenticatedViewer } from '@/lib/server/auth';
import {
  getLiveSensorSnapshot,
  isLiveSensorGroupId,
} from '@/lib/server/live-sensor-states';

export async function GET(request: Request) {
  const viewer = await getAuthenticatedViewer();
  if (!viewer) {
    return Response.json(
      { error: 'Sign in with your W3DS eID to read live sensors.' },
      { status: 401 },
    );
  }
  const group = new URL(request.url).searchParams.get('group')?.trim();
  if (group && !isLiveSensorGroupId(group)) {
    return Response.json({ error: 'Unknown system.' }, { status: 404 });
  }
  const snapshot = await getLiveSensorSnapshot(
    viewer.eName,
    group && isLiveSensorGroupId(group) ? group : undefined,
  );
  return Response.json(snapshot, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
