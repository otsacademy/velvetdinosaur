'use client';

import { useState, type ComponentType, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  BedDouble,
  ArrowUpRight,
  CalendarDays,
  House,
  ChevronRight,
  Database,
  Image as ImageIcon,
  Inbox,
  LayoutGrid,
  LifeBuoy,
  Mail,
  Menu,
  MessageSquare,
  FilePenLine,
  Palette,
  Route as RouteIcon,
  RotateCcw,
  Send
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DemoHelpTooltip } from '@/components/demo/demo-help-tooltip';
import { DemoOnboardingControls } from '@/components/demo/onboarding/demo-onboarding-controls.client';
import { cn } from '@/lib/utils';

type DemoWorkspaceNavKey =
  | 'overview'
  | 'pages'
  | 'news'
  | 'contact-templates'
  | 'newsletter'
  | 'reviews'
  | 'stays'
  | 'routes'
  | 'bookings'
  | 'inbox'
  | 'calendar'
  | 'media'
  | 'theme'
  | 'support';

type DemoWorkspaceShellProps = {
  children: ReactNode;
  breadcrumbLabel: string;
  activeNav: DemoWorkspaceNavKey;
  mainSiteHref: string;
  onResetDemo: () => void;
};

type NavItem = {
  key: DemoWorkspaceNavKey;
  label: string;
  href?: string;
  icon: ComponentType<{ className?: string }>;
  hint?: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { key: 'overview', label: 'Overview', href: '/demo', icon: House },
      { key: 'inbox', label: 'Inbox', href: '/demo/inbox', icon: Inbox },
      { key: 'calendar', label: 'Calendar', href: '/demo/calendar', icon: CalendarDays },
      { key: 'support', label: 'Support Portal', href: '/demo/support', icon: LifeBuoy }
    ]
  },
  {
    label: 'Content',
    items: [
      { key: 'pages', label: 'Pages', href: '/demo/new', icon: LayoutGrid },
      { key: 'news', label: 'Article Editor', href: '/demo/news', icon: FilePenLine },
      { key: 'contact-templates', label: 'Contact Templates', href: '/demo/contact-templates', icon: Mail },
      { key: 'newsletter', label: 'Newsletter', href: '/demo/newsletter', icon: Send },
      { key: 'reviews', label: 'Reviews', href: '/demo/reviews', icon: MessageSquare },
      { key: 'media', label: 'Media Library', href: '/demo/media', icon: ImageIcon }
    ]
  },
  {
    label: 'Travel',
    items: [
      { key: 'stays', label: 'Stays', href: '/demo/stays', icon: BedDouble },
      { key: 'routes', label: 'Routes', href: '/demo/routes', icon: RouteIcon },
      { key: 'bookings', label: 'Booking API', href: '/demo/bookings', icon: Database }
    ]
  },
  {
    label: 'Site Design',
    items: [{ key: 'theme', label: 'Theme Editor', href: '/demo/theme-editor', icon: Palette }]
  }
];

function initials(value: string) {
  return (
    value
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'SC'
  );
}

function DemoSidebarNav({
  activeNav,
  onNavigate
}: {
  activeNav: DemoWorkspaceNavKey;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-6 px-3 py-4">
      {navGroups.map((group) => (
        <div key={group.label} className="space-y-2.5">
          <p className="px-3 text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--vd-primary)]">
            {group.label}
          </p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const active = item.key === activeNav;
              const Icon = item.icon;
              const itemClassName = cn(
                'group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                active
                  ? 'bg-[var(--vd-muted)] font-medium text-[var(--vd-primary)]'
                  : 'text-[var(--vd-fg)] hover:bg-[var(--vd-muted)]/80 hover:text-[var(--vd-primary)]'
              );

              const content = (
                <>
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      active ? 'text-[var(--vd-primary)]' : 'text-[var(--vd-muted-fg)] group-hover:text-[var(--vd-primary)]'
                    )}
                  />
                  <span>{item.label}</span>
                </>
              );

              if (item.href) {
                return (
                  <Link key={item.key} href={item.href} onClick={onNavigate} className={itemClassName}>
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    if (item.hint) toast.info(item.hint);
                    onNavigate?.();
                  }}
                  className={itemClassName}
                >
                  {content}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function DemoWorkspaceShell({
  children,
  breadcrumbLabel,
  activeNav,
  mainSiteHref,
  onResetDemo
}: DemoWorkspaceShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const demoAccount = {
    name: 'Sauro CMS Demo',
    email: 'demo@velvetdinosaur.com'
  };

  return (
    <div className="min-h-screen bg-[var(--vd-muted)]/15 text-[var(--vd-fg)]">
      <div className="flex min-h-screen w-full">
        <aside className="hidden w-80 shrink-0 border-r border-[var(--vd-border)] bg-[var(--vd-bg)] md:block">
          <div className="sticky top-0 flex h-screen flex-col overflow-hidden">
            <div className="space-y-4 border-b border-[var(--vd-border)] px-5 pb-5 pt-6">
              <a href={mainSiteHref} className="flex items-center gap-3" aria-label="Back to Velvet Dinosaur home page">
                <Image
                  src="/logo.webp"
                  alt="Velvet Dinosaur"
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full border border-[var(--vd-border)] object-contain"
                />
                <div className="space-y-1">
                  <p className="text-lg font-semibold tracking-tight text-[var(--vd-fg)]">Sauro CMS</p>
                  <p className="text-xs text-[var(--vd-muted-fg)]">Public sandbox workspace</p>
                </div>
              </a>

              <div className="flex gap-2">
                <DemoHelpTooltip content="Jump back to the public Velvet Dinosaur site without leaving the demo tab open.">
                  <Button
                    asChild
                    variant="outline"
                    className="flex-1 justify-between border-[var(--vd-border)] bg-[var(--vd-card)] text-[var(--vd-fg)] hover:bg-[var(--vd-muted)] hover:text-[var(--vd-fg)]"
                  >
                    <a href={mainSiteHref}>
                      View site
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </Button>
                </DemoHelpTooltip>
                <DemoHelpTooltip content="Restore this workspace to its original fictional demo data. Refreshing the page does the same thing.">
                  <Button variant="outline" className="border-[var(--vd-border)]" onClick={onResetDemo}>
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                </DemoHelpTooltip>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col bg-[var(--vd-bg)]">
              <ScrollArea className="flex-1">
                <DemoSidebarNav activeNav={activeNav} />
              </ScrollArea>

              <div className="space-y-3 px-4 pb-4 pt-3">
                <div className="rounded-xl border border-[var(--vd-border)] bg-[var(--vd-card)] p-3">
                  <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--vd-primary)]">Demo session</p>
                  <p className="mt-2 text-sm text-[var(--vd-fg)]">Everything here is fictional and resets when you leave or refresh.</p>
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-[var(--vd-border)] bg-[var(--vd-bg)] px-2.5 py-2 text-[var(--vd-fg)]">
                    <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-[var(--vd-muted)] text-xs font-semibold">
                      {initials(demoAccount.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-[var(--vd-fg)]">{demoAccount.name}</p>
                      <p className="truncate text-[11px] text-[var(--vd-muted-fg)]">{demoAccount.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="px-3 pb-6 pt-3 md:px-6 md:pb-8 md:pt-4">
            <div className="mb-5 flex items-center gap-2 rounded-[var(--vd-radius)] bg-[var(--vd-card)]/95 px-3 py-2.5 shadow-sm">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8 md:hidden">
                    <Menu className="h-4 w-4" />
                    <span className="sr-only">Open navigation</span>
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-[90vw] max-w-sm border-r border-[var(--vd-border)] bg-[var(--vd-bg)] p-0 text-[var(--vd-fg)]"
                >
                  <SheetHeader className="space-y-4 border-b border-[var(--vd-border)] px-4 py-5 text-left">
                    <SheetTitle className="sr-only">Demo navigation</SheetTitle>
                    <a href={mainSiteHref} onClick={() => setMobileOpen(false)} className="flex items-center gap-3">
                      <Image
                        src="/logo.webp"
                        alt="Velvet Dinosaur"
                        width={36}
                        height={36}
                        className="h-9 w-9 rounded-full border border-[var(--vd-border)] object-contain"
                      />
                      <div className="space-y-1">
                        <p className="text-lg font-semibold tracking-tight text-[var(--vd-fg)]">Sauro CMS</p>
                        <p className="text-xs text-[var(--vd-muted-fg)]">Public sandbox workspace</p>
                      </div>
                    </a>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-11rem)]">
                    <DemoSidebarNav activeNav={activeNav} onNavigate={() => setMobileOpen(false)} />
                  </ScrollArea>
                  <div className="space-y-2 px-4 pb-4">
                    <Button variant="outline" className="w-full justify-between" onClick={onResetDemo}>
                      Reset demo
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-between">
                      <a href={mainSiteHref}>
                        Back to site
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[var(--vd-muted-fg)] md:text-sm">
                  <span className="rounded-full bg-[var(--vd-muted)] px-2.5 py-1 text-[11px] font-semibold text-[var(--vd-fg)]">
                    Sauro CMS
                  </span>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span className="truncate font-semibold text-[var(--vd-fg)]">{breadcrumbLabel}</span>
                </div>
              </div>

              <DemoOnboardingControls pageKey={activeNav} />

              <div className="hidden items-center gap-2 lg:flex">
                <Badge className="border-transparent bg-[var(--vd-muted)] text-[var(--vd-fg)]">Public demo</Badge>
                <span className="text-xs text-[var(--vd-muted-fg)]">Nothing in this workspace is saved.</span>
                <Button variant="outline" size="sm" onClick={onResetDemo}>
                  <RotateCcw className="h-4 w-4" />
                  Reset demo
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href={mainSiteHref}>
                    Back to site
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
