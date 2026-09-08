'use client';

import { usePathname } from 'next/navigation';
import {
  Bolt,
  Droplets,
  HeartHandshake,
  LayoutDashboard,
  ListOrdered,
  Menu,
  Scale,
  Settings,
  X,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { AppLink } from '@/components/app/app-link';
import { StatusBadge } from '@/components/app/status-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { demoProperty, demoUser } from '@/lib/fixtures/property';
import { cn } from '@/lib/utils';

const navItems: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}[] = [
  { href: '/app', label: 'Home', icon: LayoutDashboard, exact: true },
  { href: '/app/value', label: 'Paid → received', icon: Scale },
  { href: '/app/electricity', label: 'Electricity', icon: Bolt },
  { href: '/app/water', label: 'Water', icon: Droplets },
  { href: '/app/care', label: 'Care', icon: HeartHandshake },
  { href: '/app/stages', label: 'Stages', icon: ListOrdered },
  { href: '/app/settings', label: 'Settings', icon: Settings },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const hideChrome = pathname.startsWith('/app/welcome');

  if (hideChrome) {
    return (
      <div className="min-h-screen bg-[#f5f1e9] text-[#102030]">{children}</div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f1e9] text-[#102030]">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[#d8d0c3] bg-[#f0eadf] lg:flex">
          <div className="border-b border-[#d8d0c3] px-5 py-6">
            <AppLink
              href="/app"
              className="flex items-center gap-3"
              aria-label="Oriel home"
            >
              <span className="flex size-9 items-center justify-center rounded-full border border-[#c3ad85] bg-[#173850] font-serif text-lg italic text-white">
                O
              </span>
              <span className="text-sm font-semibold tracking-[0.22em]">
                ORIEL
              </span>
            </AppLink>
            <div className="mt-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8f7040]">
                First home
              </p>
              <div className="mt-2 border border-[#d4cdbf] bg-[#fcfbf8] px-3 py-2.5 text-sm">
                <span className="block font-medium text-[#153044]">
                  {demoProperty.name}
                </span>
                <span className="block text-xs text-[#6b777f]">
                  {demoProperty.area}
                </span>
              </div>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9aa3aa]">
                Stage 1 sketch · not final UI
              </p>
            </div>
          </div>
          <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Primary">
            {navItems.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(pathname, href, exact);
              return (
                <AppLink
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a88348]/50',
                    active
                      ? 'bg-[#173850] text-white'
                      : 'text-[#3a4b56] hover:bg-[#e7dfd0]',
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="size-4" strokeWidth={1.6} />
                  {label}
                </AppLink>
              );
            })}
          </nav>
          <div className="border-t border-[#d8d0c3] p-4 text-xs leading-5 text-[#6b777f]">
            Electricity & water first. Cameras and people-tracking are later.
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-[#d8d0c3] bg-[#f5f1e9]/95">
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="border-[#d4cdbf] bg-[#fcfbf8] lg:hidden"
                  aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                  onClick={() => setMobileOpen((open) => !open)}
                >
                  {mobileOpen ? (
                    <X className="size-4" />
                  ) : (
                    <Menu className="size-4" />
                  )}
                </Button>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#153044]">
                    {demoProperty.label}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusBadge
                      state={demoProperty.overallHealth}
                      label={demoProperty.overallHealthLabel}
                    />
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      className="h-9 gap-2 border-[#d4cdbf] bg-[#fcfbf8] px-2.5"
                      aria-label="User menu"
                    />
                  }
                >
                  <span className="flex size-6 items-center justify-center rounded-full bg-[#173850] text-[10px] font-semibold text-white">
                    {demoUser.initials}
                  </span>
                  <span className="hidden text-sm sm:inline">
                    {demoUser.name}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 border-[#d4cdbf] bg-[#fcfbf8]"
                >
                  <DropdownMenuLabel>{demoUser.name}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem render={<a href="/app/stages" />}>
                    Stages (now / later)
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<a href="/app/settings" />}>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<a href="/" />}>
                    Marketing site (secondary)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {mobileOpen ? (
              <nav
                className="border-t border-[#d8d0c3] bg-[#f0eadf] px-3 py-3 lg:hidden"
                aria-label="Mobile"
              >
                <div className="grid grid-cols-2 gap-2">
                  {navItems.map(({ href, label, icon: Icon, exact }) => {
                    const active = isActive(pathname, href, exact);
                    return (
                      <AppLink
                        key={href}
                        href={href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium',
                          active
                            ? 'bg-[#173850] text-white'
                            : 'bg-[#fcfbf8] text-[#3a4b56]',
                        )}
                      >
                        <Icon className="size-4" />
                        {label}
                      </AppLink>
                    );
                  })}
                </div>
              </nav>
            ) : null}
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>

          <nav
            className="sticky bottom-0 z-30 border-t border-[#d8d0c3] bg-[#f0eadf] px-2 py-2 lg:hidden"
            aria-label="Bottom"
          >
            <div className="grid grid-cols-5 gap-1">
              {navItems
                .slice(0, 5)
                .map(({ href, label, icon: Icon, exact }) => {
                  const active = isActive(pathname, href, exact);
                  return (
                    <AppLink
                      key={href}
                      href={href}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-md px-1 py-2 text-[10px] font-semibold tracking-[0.04em]',
                        active ? 'bg-[#173850] text-white' : 'text-[#4a5a64]',
                      )}
                    >
                      <Icon className="size-4" />
                      {label.split(' ')[0]}
                    </AppLink>
                  );
                })}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
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
    <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#d8d0c3] pb-6 md:flex-row md:items-end">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="mt-3 font-serif text-3xl tracking-[-0.04em] text-[#153044] sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-[15px] leading-6 text-[#52626c]">
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
    <div className="border border-dashed border-[#d4cdbf] bg-[#fcfbf8] p-5 text-sm leading-6 text-[#52626c]">
      {children}
    </div>
  );
}
