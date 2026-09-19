import { HomeAssistantConnection } from '@/components/app/home-assistant-connection';
import { getAuthenticatedViewer } from '@/lib/server/auth';
import { getHomeAssistantConnectionSummary } from '@/lib/server/home-assistant';
import { isLocalOrielDevelopment } from '@/lib/server/local-development';

export const dynamic = 'force-dynamic';

export default async function HomeAssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const viewer = await getAuthenticatedViewer();
  if (!viewer) return null;

  const [connection, params] = await Promise.all([
    getHomeAssistantConnectionSummary(viewer.eName),
    searchParams,
  ]);

  return (
    <HomeAssistantConnection
      connection={connection}
      localDevelopment={isLocalOrielDevelopment()}
      status={params.status}
    />
  );
}
