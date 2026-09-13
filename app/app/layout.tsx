import type { ReactNode } from 'react';
import { AccessRequired } from '@/components/app/access-required';
import { AppShell } from '@/components/app/app-shell';
import { AppStateProvider } from '@/lib/app-state';
import { getAuthenticatedViewer } from '@/lib/server/auth';
import { listPropertiesForViewer } from '@/lib/server/properties';

export const dynamic = 'force-dynamic';

function initials(displayName: string) {
  const words = displayName.split(/\s+/).filter(Boolean);
  return (words.length ? words : ['Oriel'])
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

export default async function ProductAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const viewer = await getAuthenticatedViewer();
  if (!viewer) return <AccessRequired />;

  const properties = await listPropertiesForViewer(viewer);
  const property = properties[0] ?? null;

  return (
    <AppStateProvider>
      <div className="oriel-app">
        <AppShell
          property={property}
          viewer={{
            displayName: viewer.displayName,
            initials: initials(viewer.displayName),
          }}
        >
          {children}
        </AppShell>
      </div>
    </AppStateProvider>
  );
}
