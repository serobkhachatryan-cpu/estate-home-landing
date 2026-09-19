import { getInvestorShareForRequest } from '@/lib/server/investor-share';
import { getImportedSensorOverview } from '@/lib/server/sensor-history';

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
  const history = await getImportedSensorOverview(
    share.ownerEName,
    group || undefined,
  );
  return Response.json(history, {
    headers: {
      'Cache-Control': 'private, no-store',
      Vary: 'Authorization',
    },
  });
}
