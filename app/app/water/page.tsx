'use client';

import { UtilityDetailPage } from '@/components/app/utility-detail-page';
import { waterDetail } from '@/lib/fixtures/utilities';

export default function WaterPage() {
  return <UtilityDetailPage detail={waterDetail} />;
}
