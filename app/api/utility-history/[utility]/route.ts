import { getAuthenticatedViewer } from '@/lib/server/auth';
import { getImportedUtilityHistory } from '@/lib/server/utility-history';

type RouteContext = {
  params: Promise<{ utility: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const viewer = await getAuthenticatedViewer();
  if (!viewer) {
    return Response.json(
      { error: 'Sign in with your W3DS eID to read utility history.' },
      { status: 401 },
    );
  }

  const { utility } = await context.params;
  if (utility !== 'electricity' && utility !== 'water') {
    return Response.json({ error: 'Unknown utility.' }, { status: 404 });
  }

  const history = await getImportedUtilityHistory(viewer.eName, utility);
  return Response.json(history, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
