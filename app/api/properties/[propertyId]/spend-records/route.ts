import {
  createSpendRecord,
  listSpendRecords,
  validateSpendRecord,
} from '@/lib/server/spend-records';
import { getAuthenticatedViewer } from '@/lib/server/auth';
import {
  canWriteProperty,
  getPropertyForViewer,
} from '@/lib/server/properties';

type RouteContext = {
  params: Promise<{ propertyId: string }>;
};

function errorResponse(error: unknown) {
  const message =
    error instanceof Error ? error.message : 'Something went wrong.';
  const status = message === 'Property not found.' ? 404 : 400;
  return Response.json({ error: message }, { status });
}

async function resolveProperty(context: RouteContext) {
  const viewer = await getAuthenticatedViewer();
  if (!viewer) {
    return {
      error: Response.json(
        { error: 'Sign in to access a property.' },
        { status: 401 },
      ),
    };
  }

  const { propertyId } = await context.params;
  const property = await getPropertyForViewer(viewer, propertyId);
  if (!property) {
    return {
      error: Response.json({ error: 'Property not found.' }, { status: 404 }),
    };
  }

  return { property };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const access = await resolveProperty(context);
    if ('error' in access) return access.error;
    const records = await listSpendRecords(access.property.id);
    const factTotalPence = records
      .filter((record) => record.kind === 'fact')
      .reduce((total, record) => total + record.amountPence, 0);

    return Response.json({ records, factTotalPence });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const access = await resolveProperty(context);
    if ('error' in access) return access.error;
    if (!canWriteProperty(access.property)) {
      return Response.json(
        {
          error: 'Your property role can review records but cannot add costs.',
        },
        { status: 403 },
      );
    }
    const payload = await request.json();
    const input = validateSpendRecord(payload);
    const record = await createSpendRecord(access.property.id, input);
    return Response.json({ record }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
