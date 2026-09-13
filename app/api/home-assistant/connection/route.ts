import { getAuthenticatedViewer } from '@/lib/server/auth';
import {
  disconnectHomeAssistant,
  getHomeAssistantConnectionSummary,
} from '@/lib/server/home-assistant';

export const dynamic = 'force-dynamic';

export async function GET() {
  const viewer = await getAuthenticatedViewer();
  if (!viewer) {
    return Response.json(
      { error: 'Sign in with your W3DS eID before reading Home Assistant.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    return Response.json(
      await getHomeAssistantConnectionSummary(viewer.eName),
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch {
    return Response.json(
      { error: 'Could not read the Home Assistant connection.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

export async function DELETE() {
  const viewer = await getAuthenticatedViewer();
  if (!viewer) {
    return Response.json(
      { error: 'Sign in with your W3DS eID before changing Home Assistant.' },
      { status: 401 },
    );
  }

  try {
    await disconnectHomeAssistant(viewer.eName);
    return Response.json(
      { disconnected: true },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return Response.json(
      { error: 'Could not disconnect Home Assistant.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
