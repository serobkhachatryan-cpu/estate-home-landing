import { getInvestorShareForRequest } from '@/lib/server/investor-share';
import {
  getLiveSensorSnapshot,
  isLiveSensorGroupId,
} from '@/lib/server/live-sensor-states';

export async function GET(request: Request) {
  const share = await getInvestorShareForRequest(request);
  if (!share) {
    return Response.json(
      { error: 'This investor link is unavailable or has expired.' },
      {
        status: 401,
        headers: {
          'Cache-Control': 'private, no-store',
          Vary: 'Authorization',
        },
      },
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
  const snapshot = await getLiveSensorSnapshot(share.ownerEName, {
    groupId: group && isLiveSensorGroupId(group) ? group : undefined,
    entityId: entityId || undefined,
  });
  return Response.json(snapshot, {
    headers: {
      'Cache-Control': 'private, no-store',
      Vary: 'Authorization',
    },
  });
}
