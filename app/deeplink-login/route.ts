import {
  completeW3dsBrowserSignIn,
  receiveW3dsAuthCallback,
  sessionCookieFor,
} from '@/lib/server/w3ds-auth';

export const dynamic = 'force-dynamic';

function callbackPage(title: string, message: string) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${title}</title></head>
<body style="margin:0;background:#ebe4d8;color:#153044;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:grid;min-height:100vh;place-items:center;padding:24px;box-sizing:border-box">
  <main style="max-width:360px;border-radius:24px;background:#f8f5ef;padding:28px;box-shadow:0 18px 56px rgba(16,32,48,.12);text-align:center">
    <p style="margin:0;color:#8f7040;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase">Oriel × W3DS</p>
    <h1 style="margin:14px 0 0;font-size:28px;letter-spacing:-.04em">${title}</h1>
    <p style="margin:14px 0 0;color:#5a6a73;font-size:15px;line-height:1.55">${message}</p>
  </main>
</body></html>`;
}

/**
 * The current W3DS eID Wallet completes `w3ds://auth` by navigating Safari to
 * this callback URL. The protocol's API callback remains available at
 * `POST /api/auth` for wallet versions that post the signed payload directly.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const result = await receiveW3dsAuthCallback({
    w3id:
      requestUrl.searchParams.get('ename') ??
      requestUrl.searchParams.get('w3id'),
    session: requestUrl.searchParams.get('session'),
    signature: requestUrl.searchParams.get('signature'),
  });

  if (!result.ok) {
    return new Response(
      callbackPage(
        'Sign-in could not be confirmed',
        'This sign-in request is no longer valid. Return to Oriel and start a new request.',
      ),
      {
        status: result.status,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      },
    );
  }

  const completion = await completeW3dsBrowserSignIn(
    request,
    requestUrl.searchParams.get('session'),
  );

  if (completion.state !== 'complete') {
    return new Response(
      callbackPage(
        'Identity confirmed',
        'Return to the Oriel page where you started sign-in. It will finish automatically.',
      ),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: new URL(completion.returnTo, completion.origin).toString(),
      'Set-Cookie': sessionCookieFor(
        completion.sessionToken,
        completion.expiresAt,
        completion.origin,
      ),
    },
  });
}
