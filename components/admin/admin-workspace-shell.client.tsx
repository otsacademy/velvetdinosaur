'use client';

import { Fragment, Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, ExternalLink, LifeBuoy, Menu } from 'lucide-react';
import { SessionControls } from '@/components/auth/session-controls.client';
import { SauroCmsBadge } from '@/components/admin/sauro-cms-badge';
import { AdminReviewModeSwitch } from '@/components/review/admin-review-mode-switch.client';
import {
  AdminBrandMark,
  ADMIN_BRAND_COLOR,
  BRAND_HOME_HREF,
  CONTENT_TABS,
  FORCE_ADMIN_ROUTES,
  LIVE_SITE_HREF,
  NAV_GROUPS,
  type ContentTab,
  type SidebarNavGroup,
  type SidebarNavItem
} from '@/components/admin/workspace-shell.config';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

type BreadcrumbItemValue = {
  label: string;
  href?: string;
};

function normalizeEditTab(value: string | null): ContentTab {
  if (value && CONTENT_TABS.includes(value)) return value;
  return CONTENT_TABS[0];
}

function hrefPath(href: string) {
  const [path] = href.split('?');
  return path || href;
}

function pathMatches(pathname: string, candidate: string) {
  return pathname === candidate || pathname.startsWith(`${candidate}/`);
}

function isActiveItem(pathname: string, currentEditTab: ContentTab, item: SidebarNavItem) {
  if (item.editTab) {
    if (pathname === '/edit') {
      return currentEditTab === item.editTab;
    }
    return Boolean(item.pathPrefixes?.some((prefix) => pathMatches(pathname, prefix)));
  }

  const basePath = hrefPath(item.href);
  if (pathMatches(pathname, basePath)) return true;
  return Boolean(item.pathPrefixes?.some((prefix) => pathMatches(pathname, prefix)));
}

function activeSpecificity(pathname: string, item: SidebarNavItem) {
  const baseLength = pathMatches(pathname, hrefPath(item.href)) ? hrefPath(item.href).length : 0;
  const prefixLength = Math.max(
    0,
    ...(item.pathPrefixes || []).map((prefix) => (pathMatches(pathname, prefix) ? prefix.length : 0))
  );
  return Math.max(baseLength, prefixLength);
}

function humanizeSegment(segment: string) {
  const decoded = decodeURIComponent(segment);
  return decoded
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function findBestMatch(pathname: string, currentEditTab: ContentTab, navGroups: SidebarNavGroup[]) {
  const allItems = navGroups.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label })));
  return allItems
    .filter((item) => isActiveItem(pathname, currentEditTab, item))
    .sort((a, b) => activeSpecificity(pathname, b) - activeSpecificity(pathname, a))[0];
}

function buildBreadcrumbs(
  pathname: string,
  currentEditTab: ContentTab,
  navGroups: SidebarNavGroup[]
): BreadcrumbItemValue[] {
  const isAdminArea = pathname.startsWith('/admin') || pathname.startsWith('/account');
  const match = findBestMatch(pathname, currentEditTab, navGroups);
  if (!match) {
    if (isAdminArea) return [{ label: 'Admin' }];
    if (pathname.startsWith('/edit')) return [{ label: 'Content' }];
    return [{ label: 'Dashboard' }];
  }

  const breadcrumbs: BreadcrumbItemValue[] = [];

  if (isAdminArea) {
    breadcrumbs.push({ label: 'Admin', href: '/edit' });
    if (match.group !== 'Admin') {
      breadcrumbs.push({ label: match.group });
    }
  } else if (pathname.startsWith('/edit')) {
    breadcrumbs.push({ label: 'Content', href: '/edit' });
  } else {
    breadcrumbs.push({ label: match.group });
  }

  const matchPath = hrefPath(match.href);
  breadcrumbs.push({ label: match.label, href: match.href });

  const suffix = pathname.slice(matchPath.length).split('/').filter(Boolean);
  if (suffix.length) {
    const base = matchPath === '/' ? '' : matchPath;
    suffix.forEach((segment, index) => {
      const isLast = index === suffix.length - 1;
      const suffixPath = `${base}/${suffix.slice(0, index + 1).join('/')}`;
      breadcrumbs.push({
        label: humanizeSegment(segment),
        href: isLast ? undefined : suffixPath
      });
    });
  }

  if (breadcrumbs.length > 1) {
    const first = breadcrumbs[0];
    const middle = breadcrumbs.slice(1, -1);
    const last = breadcrumbs[breadcrumbs.length - 1];
    return [first, ...middle.map((item) => ({ ...item, href: item.href })), { ...last, href: undefined }];
  }

  return breadcrumbs;
}

function SidebarNav({
  pathname,
  currentEditTab,
  navGroups,
  onNavigate
}: {
  pathname: string;
  currentEditTab: ContentTab;
  navGroups: SidebarNavGroup[];
  onNavigate?: () => void;
}) {
  // Only the most specific match lights up — several items can prefix-match
  // one pathname (e.g. an '/admin' overview item on any /admin/* page) and
  // highlighting them all reads as two current pages.
  const bestMatch = findBestMatch(pathname, currentEditTab, navGroups);
  return (
    <nav aria-label="Admin navigation" className="space-y-6 px-3 py-4">
      {navGroups.map((group) => (
        <div key={group.label} className="space-y-2.5">
          <p className="px-3 text-[10px] font-medium tracking-[0.22em] uppercase text-white/60">
            {group.label}
          </p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const active = bestMatch ? bestMatch.href === item.href : isActiveItem(pathname, currentEditTab, item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  onClick={onNavigate}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white transition-colors',
                    'before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-r-full before:content-[""]',
                    active
                      ? 'bg-white/16 before:bg-[var(--vd-ring)]'
                      : 'before:bg-transparent hover:bg-white/10'
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0 transition-opacity', active ? 'opacity-100' : 'opacity-75 group-hover:opacity-100')} />
                  <span className={cn('transition-opacity', active ? 'opacity-100' : 'opacity-80 group-hover:opacity-100')}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function BreadcrumbBar({
  pathname,
  currentEditTab,
  navGroups
}: {
  pathname: string;
  currentEditTab: ContentTab;
  navGroups: SidebarNavGroup[];
}) {
  const breadcrumbs = useMemo(
    () => buildBreadcrumbs(pathname, currentEditTab, navGroups),
    [pathname, currentEditTab, navGroups]
  );

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="text-xs font-medium tracking-[0.01em] text-[var(--vd-muted-fg)] md:text-sm">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <Fragment key={`${item.label}-${index}`}>
              <BreadcrumbItem>
                {isLast || !item.href ? (
                  <BreadcrumbPage className="truncate font-semibold text-[var(--vd-fg)]">{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    asChild
                    className="text-[var(--vd-fg)]/85 underline-offset-4 transition-colors hover:text-[var(--vd-ring)] hover:underline"
                  >
                    <Link href={item.href} prefetch={false}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast ? (
                <BreadcrumbSeparator className="text-[var(--vd-muted-fg)]/80">
                  <ChevronRight className="h-3.5 w-3.5" />
                </BreadcrumbSeparator>
              ) : null}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function AdminWorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const currentEditTab: ContentTab =
    typeof window === 'undefined'
      ? CONTENT_TABS[0]
      : normalizeEditTab(new URLSearchParams(window.location.search).get('tab'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [canManageReviewMode, setCanManageReviewMode] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch('/api/account/profile', { cache: 'no-store', credentials: 'include' });
        if (!response.ok) return;
        const payload = (await response.json().catch(() => ({}))) as { isAdmin?: boolean; canManageReviewMode?: boolean };
        if (!active) return;
        setIsAdmin(Boolean(payload.isAdmin));
        setCanManageReviewMode(Boolean(payload.canManageReviewMode));
      } catch {
        // Silent fallback: admin-only links remain hidden.
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const canSeeAdminNav =
    isAdmin || FORCE_ADMIN_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  const navGroups = useMemo(() => {
    return NAV_GROUPS
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) => (!item.adminOnly || canSeeAdminNav) && (!item.requiresReviewModeAccess || canManageReviewMode)
        )
      }))
      .filter((group) => group.items.length > 0);
  }, [canManageReviewMode, canSeeAdminNav]);

  return (
    <div className="min-h-screen bg-[var(--vd-muted)]/15 text-[var(--vd-fg)]">
      <a
        href="#workspace-content"
        className="fixed left-4 top-3 z-50 -translate-y-20 rounded-[var(--vd-radius)] bg-[var(--vd-primary)] px-4 py-2 text-sm font-semibold text-[var(--vd-primary-fg)] transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      <div className="flex min-h-screen w-full">
        <aside className="hidden w-80 shrink-0 text-white md:block" style={{ backgroundColor: ADMIN_BRAND_COLOR }}>
          <div className="sticky top-0 flex h-screen flex-col overflow-hidden">
            <div className="space-y-3 px-5 pt-6">
              <Link href={BRAND_HOME_HREF} prefetch={false} className="block w-full" aria-label="Go to content dashboard">
                <AdminBrandMark />
              </Link>
              <Button asChild variant="secondary" className="w-full justify-between bg-white/14 text-white hover:bg-white/20">
                <Link href={LIVE_SITE_HREF} target="_blank" rel="noreferrer">
                  View Site
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <SidebarNav pathname={pathname} currentEditTab={currentEditTab} navGroups={navGroups} />
            </ScrollArea>
            <div className="space-y-2 px-4 pb-4 pt-3">
              {canManageReviewMode ? (
                <Suspense fallback={null}>
                  <AdminReviewModeSwitch variant="sidebar" className="lg:hidden" />
                </Suspense>
              ) : null}
              {/* Sign out lives in the header on desktop; repeating it here
                  read as two different session controls. The mobile drawer
                  keeps its own copy because the header collapses there. */}
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div id="workspace-content" tabIndex={-1} className="px-3 pb-6 pt-3 md:px-6 md:pb-8 md:pt-4">
            <div className="mb-5 flex items-center gap-2 rounded-[var(--vd-radius)] bg-[var(--vd-card)]/95 px-3 py-2.5 shadow-sm">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8 md:hidden">
                    <Menu className="h-4 w-4" />
                    <span className="sr-only">Open admin navigation</span>
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-[90vw] max-w-sm p-0 text-white"
                  style={{ backgroundColor: ADMIN_BRAND_COLOR }}
                >
                  <SheetHeader className="px-4 py-5 text-left">
                    <SheetTitle className="sr-only">Admin navigation</SheetTitle>
                    <Link
                      href={BRAND_HOME_HREF}
                      prefetch={false}
                      onClick={() => setMobileOpen(false)}
                      className="block w-full"
                      aria-label="Go to content dashboard"
                    >
                      <AdminBrandMark compact />
                    </Link>
                    <Button
                      asChild
                      variant="secondary"
                      className="mt-3 w-full justify-between bg-white/14 text-white hover:bg-white/20"
                    >
                      <Link href={LIVE_SITE_HREF} target="_blank" rel="noreferrer">
                        View Site
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-14rem)]">
                    <SidebarNav
                      pathname={pathname}
                      currentEditTab={currentEditTab}
                      navGroups={navGroups}
                      onNavigate={() => setMobileOpen(false)}
                    />
                  </ScrollArea>
                  <div className="space-y-2 px-4 pb-4">
                    {canManageReviewMode ? (
                      <Suspense fallback={null}>
                        <AdminReviewModeSwitch variant="sidebar" className="lg:hidden" />
                      </Suspense>
                    ) : null}
                    <SessionControls variant="sidebar" showIdentity={false} showAccountLink={false} />
                  </div>
                </SheetContent>
              </Sheet>
              <div className="min-w-0 flex-1">
                <BreadcrumbBar pathname={pathname} currentEditTab={currentEditTab} navGroups={navGroups} />
              </div>
              <div className="hidden md:flex md:items-center md:gap-2">
                {canSeeAdminNav ? (
                  <Button variant="ghost" size="sm" asChild className="h-8 rounded-full px-2.5">
                    <Link href="/edit/support" prefetch={false}>
                      <SauroCmsBadge compact />
                      <LifeBuoy className="h-3.5 w-3.5 opacity-80" />
                      <span className="text-xs">Customer Portal</span>
                    </Link>
                  </Button>
                ) : (
                  <SauroCmsBadge />
                )}
              </div>
              <div className="hidden items-center gap-2 lg:flex">
                <Button variant="outline" size="sm" asChild>
                  <Link href={LIVE_SITE_HREF} target="_blank" rel="noreferrer">
                    View Site
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
                {canManageReviewMode ? (
                  <Suspense fallback={null}>
                    <AdminReviewModeSwitch variant="inline" />
                  </Suspense>
                ) : null}
                <SessionControls variant="inline" showAccountLink={false} />
              </div>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
