'use client';

import type { ReactNode } from 'react';
import { AppShell } from '@/components/app/app-shell';
import { AppStateProvider } from '@/lib/app-state';

export default function ProductAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AppStateProvider>
      <div className="oriel-app">
        <AppShell>{children}</AppShell>
      </div>
    </AppStateProvider>
  );
}
