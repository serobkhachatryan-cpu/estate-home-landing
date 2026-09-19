import type { Metadata } from 'next';
import { InvestorHistoryWorkspace } from '@/components/app/investor-history-workspace';

export const metadata: Metadata = {
  title: 'Oriel — Investor view',
  description: 'Read-only historical home systems view.',
  robots: { index: false, follow: false },
};

export default function InvestorPage() {
  return <InvestorHistoryWorkspace />;
}
