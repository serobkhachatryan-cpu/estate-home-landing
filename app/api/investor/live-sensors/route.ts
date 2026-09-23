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
  if (group && !isLiveSensorGroupId(group)) {
    return Response.json({ error: 'Unknown system.' }, { status: 404 });
  }
  const snapshot = await getLiveSensorSnapshot(
    share.ownerEName,
    group && isLiveSensorGroupId(group) ? group : undefined,
  );
  return Response.json(snapshot, {
    headers: {
      'Cache-Control': 'private, no-store',
      Vary: 'Authorization',
    },
  });
}
