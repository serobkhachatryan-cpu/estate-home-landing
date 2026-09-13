'use client';

import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';
import { AppLink } from '@/components/app/app-link';
import { cn } from '@/lib/utils';

const tabs: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  match?: (pathname: string) => boolean;
}[] = [
  { href: '/app', label: 'Home', icon: LayoutDashboard, exact: true },
  {
    href: '/app/spending',
    label: 'Spend',
    icon: Wallet,
    match: (pathname) =>
      pathname.startsWith('/app/spending') ||
      pathname.startsWith('/app/electricity') ||
      pathname.startsWith('/app/water'),
  },
  { href: '/app/settings', label: 'Settings', icon: Settings },
];

function isActive(pathname: string, item: (typeof tabs)[number]): boolean {
  if (item.match) return item.match(pathname);
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

type WorkspaceViewer = {
  displayName: string;
  initials: string;
};

type WorkspaceProperty = {
  name: string;
  area: string;
};

export function AppShell({
  children,
  property,
  viewer,
}: {
  children: ReactNode;
  property: WorkspaceProperty | null;
  viewer: WorkspaceViewer;
}) {
  const pathname = usePathname();
  const hideChrome = pathname.startsWith('/app/welcome');

  if (hideChrome) {
    return (
      <div className="min-h-screen bg-[#f5f1e9] text-[#102030]">{children}</div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#ebe4d8] text-[#102030]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[#f5f1e9] shadow-[0_0_0_1px_rgba(16,32,48,0.06)] sm:max-w-[480px] lg:max-w-[430px]">
        <header className="sticky top-0 z-30 border-b border-[#e0d8cb] bg-[#f5f1e9]/92 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold tracking-[-0.01em] text-[#153044]">
                {property?.name ?? 'Set up your first property'}
              </p>
              <p className="truncate text-[11px] text-[#6b777f]">
                {property?.area ?? 'Oriel private workspace'}
              </p>
            </div>
            <AppLink
              href="/app/settings"
              className="flex size-8 items-center justify-center rounded-full bg-[#173850] text-[10px] font-semibold text-white"
              aria-label="Settings"
            >
              {viewer.initials}
            </AppLink>
          </div>
        </header>

        <main className="flex-1 px-4 pb-24 pt-4">{children}</main>

        <nav
          className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-[#e0d8cb] bg-[#f5f1e9]/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-md sm:max-w-[480px] lg:max-w-[430px]"
          aria-label="Primary"
        >
          <div className="grid grid-cols-3 gap-1">
            {tabs.map((item) => {
              const active = isActive(pathname, item);
              const Icon = item.icon;
              return (
                <AppLink
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[10px] font-semibold tracking-[0.02em]',
                    active ? 'bg-[#173850] text-white' : 'text-[#5a6a73]',
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="size-4" strokeWidth={1.7} />
                  {item.label}
                </AppLink>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[1.75rem] font-semibold leading-none tracking-[-0.045em] text-[#153044]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-[13px] leading-5 text-[#6b777f]">
            {description}
          </p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}

export function EmptyNotice({ children }: { children: ReactNode }) {
  return (
    <div className="border border-dashed border-[#d4cdbf] bg-[#fcfbf8] p-4 text-sm leading-6 text-[#52626c]">
      {children}
    </div>
  );
}
