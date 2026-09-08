'use client';

import { UtilityDetailPage } from '@/components/app/utility-detail-page';
import { electricityDetail } from '@/lib/fixtures/utilities';

export default function ElectricityPage() {
  return <UtilityDetailPage detail={electricityDetail} />;
}
