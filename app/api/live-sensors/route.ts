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
  const entityId = new URL(request.url).searchParams.get('entityId')?.trim();
  if (group && !isLiveSensorGroupId(group)) {
    return Response.json({ error: 'Unknown system.' }, { status: 404 });
  }
  if (entityId && !/^sensor\.[a-zA-Z0-9_]{1,247}$/.test(entityId)) {
    return Response.json({ error: 'Unknown sensor.' }, { status: 404 });
  }
  const snapshot = await getLiveSensorSnapshot(viewer.eName, {
    groupId: group && isLiveSensorGroupId(group) ? group : undefined,
    entityId: entityId || undefined,
  });
  return Response.json(snapshot, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
