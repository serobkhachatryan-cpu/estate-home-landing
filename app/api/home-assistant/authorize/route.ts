import { getAuthenticatedViewer } from '@/lib/server/auth';
import {
  createHomeAssistantAuthOffer,
  validateHomeAssistantConnectInput,
} from '@/lib/server/home-assistant';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const viewer = await getAuthenticatedViewer();
  if (!viewer) {
    return Response.json(
      { error: 'Sign in with your W3DS eID before connecting Home Assistant.' },
      { status: 401 },
    );
  }

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const input = validateHomeAssistantConnectInput(payload);
    const offer = await createHomeAssistantAuthOffer(viewer.eName, input, {
      nativeRedirect: payload.native === true,
    });
    return Response.json(offer, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not start Home Assistant connection.',
      },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
