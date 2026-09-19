import { PageHeader } from '@/components/app/app-shell';
import { RecordedHomeOverview } from '@/components/app/recorded-home-overview';

export default function HomePage() {
  return (
    <div>
      <PageHeader title="Home" />
      <RecordedHomeOverview />
    </div>
  );
}
