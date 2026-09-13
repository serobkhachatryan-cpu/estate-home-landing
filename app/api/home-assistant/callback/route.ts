import { getAuthenticatedViewer } from '@/lib/server/auth';
import { completeHomeAssistantAuth } from '@/lib/server/home-assistant';

export const dynamic = 'force-dynamic';

function redirect(request: Request, status: string) {
  const url = new URL('/app/home-assistant', request.url);
  url.searchParams.set('status', status);
  return Response.redirect(url, 303);
}

export async function GET(request: Request) {
  const viewer = await getAuthenticatedViewer();
  if (!viewer) return redirect(request, 'sign-in-required');

  try {
    const requestUrl = new URL(request.url);
    const connected = await completeHomeAssistantAuth(
      viewer.eName,
      requestUrl.searchParams.get('code'),
      requestUrl.searchParams.get('state'),
    );
    return redirect(request, connected ? 'connected' : 'not-connected');
  } catch {
    return redirect(request, 'not-connected');
  }
}
