import { AppLink } from '@/components/app/app-link';
import { PageHeader } from '@/components/app/app-shell';
import { getAuthenticatedViewer } from '@/lib/server/auth';
import { getHomeAssistantConnectionSummary } from '@/lib/server/home-assistant';
import { listPropertiesForViewer } from '@/lib/server/properties';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const viewer = await getAuthenticatedViewer();
  if (!viewer) return null;

  const properties = await listPropertiesForViewer(viewer);
  const property = properties[0];
  const homeAssistant = await getHomeAssistantConnectionSummary(viewer.eName);

  return (
    <div>
      <PageHeader title="Settings" />

      <div className="space-y-2">
        <div className="rounded-2xl bg-[#fcfbf8] px-4 py-3">
          <p className="text-[11px] text-[#8f7040]">Person</p>
          <p className="mt-1 truncate text-[15px] font-medium text-[#153044]">
            {viewer.displayName}
          </p>
          <p className="truncate text-[12px] text-[#6b777f]">{viewer.eName}</p>
        </div>
        <div className="rounded-2xl bg-[#fcfbf8] px-4 py-3">
          <p className="text-[11px] text-[#8f7040]">Current home</p>
          <p className="mt-1 text-[15px] font-medium text-[#153044]">
            {property?.name ?? 'No property set up'}
          </p>
          <p className="text-[12px] text-[#6b777f]">
            {property
              ? `${property.area} · ${property.role}`
              : 'Create your first property to begin.'}
          </p>
        </div>
        <AppLink
          href="/app/properties"
          className="block rounded-2xl bg-[#fcfbf8] px-4 py-3 text-[14px] font-medium text-[#153044]"
        >
          Properties & access
        </AppLink>
        <AppLink
          href="/app/home-assistant"
          className="block rounded-2xl bg-[#fcfbf8] px-4 py-3"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-[14px] font-medium text-[#153044]">
              Home Assistant utilities
            </p>
            <span
              className={
                homeAssistant.connected
                  ? 'rounded-full bg-[#eef4ea] px-2 py-0.5 text-[10px] font-semibold text-[#2f4a34]'
                  : 'rounded-full bg-[#f0ebe3] px-2 py-0.5 text-[10px] font-semibold text-[#5a6270]'
              }
            >
              {homeAssistant.connected ? 'Connected' : 'Setup needed'}
            </span>
          </div>
          <p className="mt-1 text-[12px] leading-5 text-[#6b777f]">
            {homeAssistant.connected
              ? 'Electricity and water are connected to your selected sensors.'
              : 'Connect your own electricity and water sensors securely.'}
          </p>
        </AppLink>
        <AppLink
          href="/app/value"
          className="block rounded-2xl bg-[#fcfbf8] px-4 py-3 text-[14px] font-medium text-[#153044]"
        >
          Paid → received
        </AppLink>
        <AppLink
          href="/app/stages"
          className="block rounded-2xl bg-[#fcfbf8] px-4 py-3 text-[14px] font-medium text-[#153044]"
        >
          Stages
        </AppLink>
        <AppLink
          href="/"
          className="block rounded-2xl bg-[#fcfbf8] px-4 py-3 text-[14px] font-medium text-[#153044]"
        >
          Marketing site
        </AppLink>
      </div>
    </div>
  );
}
