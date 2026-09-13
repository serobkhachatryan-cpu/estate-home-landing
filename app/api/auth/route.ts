import { receiveW3dsAuthCallback } from '@/lib/server/w3ds-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const result = await receiveW3dsAuthCallback(await request.json());
    if (!result.ok) {
      return Response.json(
        {
          error:
            result.status === 400
              ? 'Invalid authentication response.'
              : 'Invalid signature.',
        },
        { status: result.status, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    return Response.json(
      { authenticated: true },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return Response.json(
      { error: 'Invalid authentication response.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
