import { PageHeader } from '@/components/app/app-shell';
import { ImportedSystemsWorkspace } from '@/components/app/imported-systems-workspace';

export default function SystemsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Systems"
        title="Recorded home systems"
        description="Every historical Home Assistant statistic is kept in its original sensor context. Oriel never adds overlapping meters, branches or archived replacements together."
      />
      <ImportedSystemsWorkspace />
    </div>
  );
}
