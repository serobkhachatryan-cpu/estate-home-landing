import { getAuthenticatedViewer } from '@/lib/server/auth';
import {
  getHomeAssistantUtilityState,
  isHomeAssistantUtilityKind,
} from '@/lib/server/home-assistant';

type RouteContext = {
  params: Promise<{ utility: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const viewer = await getAuthenticatedViewer();
  if (!viewer) {
    return Response.json(
      { error: 'Sign in with your W3DS eID to read utilities.' },
      { status: 401 },
    );
  }

  const { utility } = await context.params;
  if (!isHomeAssistantUtilityKind(utility)) {
    return Response.json({ error: 'Unknown utility.' }, { status: 404 });
  }

  const state = await getHomeAssistantUtilityState(viewer.eName, utility);
  return Response.json(state, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
