import { getAuthenticatedViewer } from '@/lib/server/auth';
import { completeHomeAssistantAuth } from '@/lib/server/home-assistant';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const viewer = await getAuthenticatedViewer();
  if (!viewer) {
    return Response.json(
      { error: 'Sign in with your W3DS eID before connecting Home Assistant.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const code = typeof payload.code === 'string' ? payload.code : null;
    const state = typeof payload.state === 'string' ? payload.state : null;
    const connected = await completeHomeAssistantAuth(
      viewer.eName,
      code,
      state,
    );
    if (!connected) {
      return Response.json(
        { error: 'Home Assistant could not complete this connection.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    return Response.json(
      { connected: true },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return Response.json(
      { error: 'Home Assistant could not complete this connection.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
