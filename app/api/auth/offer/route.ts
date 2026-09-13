import { createW3dsAuthOffer } from '@/lib/server/w3ds-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const native = new URL(request.url).searchParams.get('client') === 'native';
    const offer = await createW3dsAuthOffer(request, { native });
    return Response.json(
      {
        uri: offer.uri,
        session: offer.session,
        expiresAt: offer.expiresAt,
        returnTo: offer.returnTo,
        ...(native ? { clientProof: offer.clientProof } : {}),
      },
      {
        headers: {
          'Cache-Control': 'no-store',
          ...(native ? {} : { 'Set-Cookie': offer.attemptCookie }),
        },
      },
    );
  } catch {
    return Response.json(
      { error: 'W3DS sign-in is not available on this origin.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
