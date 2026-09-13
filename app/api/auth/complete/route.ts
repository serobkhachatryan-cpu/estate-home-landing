import {
  completeW3dsBrowserSignIn,
  completeW3dsNativeSignIn,
  sessionCookieFor,
} from '@/lib/server/w3ds-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const session = requestUrl.searchParams.get('session');
  const native = requestUrl.searchParams.get('client') === 'native';
  try {
    if (native) {
      const result = await completeW3dsNativeSignIn(
        session,
        request.headers.get('x-oriel-auth-proof'),
      );
      if (result.state === 'pending') {
        return Response.json(
          { state: 'pending' },
          { headers: { 'Cache-Control': 'no-store' } },
        );
      }
      if (result.state === 'invalid') {
        return Response.json(
          { error: 'This sign-in request is no longer valid.' },
          { status: 401, headers: { 'Cache-Control': 'no-store' } },
        );
      }

      return Response.json(
        {
          state: 'complete',
          sessionToken: result.sessionToken,
          expiresAt: result.expiresAt,
        },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const result = await completeW3dsBrowserSignIn(request, session);
    if (result.state === 'pending') {
      return Response.json(
        { state: 'pending' },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }
    if (result.state === 'invalid') {
      return Response.json(
        { error: 'This sign-in request is no longer valid.' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    return Response.json(
      { state: 'complete' },
      {
        headers: {
          'Cache-Control': 'no-store',
          'Set-Cookie': sessionCookieFor(
            result.sessionToken,
            result.expiresAt,
            result.origin,
          ),
        },
      },
    );
  } catch {
    return Response.json(
      { error: 'Could not complete your sign-in.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
