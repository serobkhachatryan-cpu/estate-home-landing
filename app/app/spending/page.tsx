import { AppLink } from '@/components/app/app-link';
import { EmptyNotice, PageHeader } from '@/components/app/app-shell';
import { SpendLedger } from '@/components/app/spend-ledger';
import { SpendParameterStrip } from '@/components/app/spend-parameter-strip';
import { SpendWeeklyTape } from '@/components/app/spend-weekly-tape';
import { getAuthenticatedViewer } from '@/lib/server/auth';
import {
  canWriteProperty,
  listPropertiesForViewer,
} from '@/lib/server/properties';
import { spendHeadline, spendParameters } from '@/lib/fixtures/spend-tree';

export const dynamic = 'force-dynamic';

type SpendingPageProps = {
  searchParams: Promise<{ property?: string }>;
};

export default async function SpendingPage({
  searchParams,
}: SpendingPageProps) {
  const viewer = await getAuthenticatedViewer();
  if (!viewer) return null;

  const properties = await listPropertiesForViewer(viewer);
  const requestedPropertyId = (await searchParams).property;
  const property =
    properties.find((candidate) => candidate.id === requestedPropertyId) ??
    properties[0];

  if (!property) {
    return (
      <div>
        <PageHeader title="Spend" />
        <EmptyNotice>
          Add your first property before recording spend.{' '}
          <AppLink
            className="font-semibold text-[#153044] underline underline-offset-2"
            href="/app/properties"
          >
            Set up a property
          </AppLink>
        </EmptyNotice>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        description={`${property.name} · ${property.area}`}
        title="Spend"
      />

      <SpendWeeklyTape
        subject={{
          id: `headline-total-${property.id}`,
          name: property.name,
          plan: spendHeadline.plan,
          fact: spendHeadline.fact,
          forecast: spendHeadline.forecast,
        }}
      />

      <SpendLedger
        canWrite={canWriteProperty(property)}
        key={property.id}
        propertyId={property.id}
      />

      <section className="mt-5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
          Parameters
        </p>
        <SpendParameterStrip parameters={spendParameters} />
      </section>
    </div>
  );
}
