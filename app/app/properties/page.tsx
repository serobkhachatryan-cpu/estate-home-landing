import { PropertiesWorkspace } from '@/components/app/properties-workspace';
import { getAuthenticatedViewer } from '@/lib/server/auth';
import { listPropertiesForViewer } from '@/lib/server/properties';

export const dynamic = 'force-dynamic';

export default async function PropertiesPage() {
  const viewer = await getAuthenticatedViewer();
  if (!viewer) return null;

  const properties = await listPropertiesForViewer(viewer);
  return <PropertiesWorkspace initialProperties={properties} />;
}
