import { getAuthenticatedViewer } from '@/lib/server/auth';
import {
  createPropertyForViewer,
  listPropertiesForViewer,
  validateNewProperty,
} from '@/lib/server/properties';

function unauthorisedResponse() {
  return Response.json(
    { error: 'Sign in to access your properties.' },
    { status: 401 },
  );
}

export async function GET() {
  const viewer = await getAuthenticatedViewer();
  if (!viewer) return unauthorisedResponse();

  try {
    const properties = await listPropertiesForViewer(viewer);
    return Response.json({ properties });
  } catch {
    return Response.json(
      { error: 'Could not load your properties.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const viewer = await getAuthenticatedViewer();
  if (!viewer) return unauthorisedResponse();

  try {
    const payload = await request.json();
    const property = await createPropertyForViewer(
      viewer,
      validateNewProperty(payload),
    );
    return Response.json({ property }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Could not create this property.';
    return Response.json({ error: message }, { status: 400 });
  }
}
