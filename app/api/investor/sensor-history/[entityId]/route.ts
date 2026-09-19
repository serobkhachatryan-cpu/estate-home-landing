import { getInvestorShareForRequest } from '@/lib/server/investor-share';
import { getImportedSensorHistory } from '@/lib/server/sensor-history';

type RouteContext = {
  params: Promise<{ entityId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
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

  const { entityId } = await context.params;
  if (!entityId || entityId.length > 255) {
    return Response.json({ error: 'Unknown sensor.' }, { status: 404 });
  }

  const history = await getImportedSensorHistory(share.ownerEName, entityId);
  return Response.json(history, {
    headers: {
      'Cache-Control': 'private, no-store',
      Vary: 'Authorization',
    },
  });
}
