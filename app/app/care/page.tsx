import { AppLink } from '@/components/app/app-link';
import { PageHeader } from '@/components/app/app-shell';
import { ImportedSensorBreakdown } from '@/components/app/imported-sensor-breakdown';

export default function CarePage() {
  return (
    <div>
      <PageHeader
        eyebrow="Care"
        title="Measured care & supplies"
        description="The recorder provides consumable levels, not contractor visits, maintenance costs or inferred wear. Those claims stay out until there is real evidence."
      />
      <ImportedSensorBreakdown
        groupId="care"
        note="These are historical printer-consumable measurements. They do not represent paid work, service completion or an asset-value calculation."
      />
      <p className="mt-6 text-[12px] leading-5 text-[#6b777f]">
        Resilience/UPS measurements are available in{' '}
        <AppLink href="/app/systems" className="font-medium text-[#815f2c] underline">
          Systems
        </AppLink>
        ; financial records belong in the spend ledger.
      </p>
    </div>
  );
}
