/**
 * Site-owned configuration for the shared Sauro admin workspace shell.
 *
 * The shell itself (admin-workspace-shell.client.tsx) is Sauro core and must
 * stay byte-identical across sites; everything a site legitimately varies —
 * brand mark, brand color, navigation, content tabs — lives here instead.
 */
import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';
import {
  BellRing,
  BookCopy,
  Briefcase,
  CalendarClock,
  CalendarDays,
  MailCheck,
  MessageSquare,
  Send,
  Gauge,
  Inbox as InboxIcon,
  Image as ImageIcon,
  LayoutDashboard,
  LayoutGrid,
  Palette,
  Radar,
  Star,
  Store,
  UserCog,
  Users,
  Workflow
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ContentTab = string;

export type SidebarNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  editTab?: ContentTab;
  pathPrefixes?: string[];
  adminOnly?: boolean;
  requiresReviewModeAccess?: boolean;
};

export type SidebarNavGroup = {
  label: string;
  items: SidebarNavItem[];
};

/** Valid values for the /edit?tab= switch; the first entry is the default. */
export const CONTENT_TABS: ContentTab[] = ['pages'];

/** Velvet Dinosaur dino blue, deepened for a readable white-on-brand sidebar. */
export const ADMIN_BRAND_COLOR = 'hsl(211 100% 24%)';
export const LIVE_SITE_HREF = '/';
/** Where the sidebar brand mark links to. */
export const BRAND_HOME_HREF = '/edit';
/** Routes that imply admin-level nav visibility even before the profile loads. */
export const FORCE_ADMIN_ROUTES = ['/admin', '/edit/newsletter', '/edit/contact-templates'];

export const NAV_GROUPS: SidebarNavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'Inbox', href: '/edit/inbox', icon: InboxIcon },
      { label: 'Calendar', href: '/edit/calendar', icon: CalendarDays },
      { label: 'Bookings', href: '/edit/bookings', icon: CalendarClock, adminOnly: true },
      { label: 'Business Reviews', href: '/admin/business-reviews', icon: Star, adminOnly: true },
      { label: 'Newsletter', href: '/edit/newsletter', icon: Send, adminOnly: true },
      { label: 'Event Outreach', href: '/edit/event-registrations', icon: MailCheck, adminOnly: true }
    ]
  },
  {
    label: 'Content',
    items: [
      { label: 'Pages', href: '/edit', icon: LayoutGrid, editTab: 'pages' },
      { label: 'Work', href: '/edit/work', icon: Briefcase, pathPrefixes: ['/edit/work'] },
      { label: 'Media Library', href: '/edit/media', icon: ImageIcon }
    ]
  },
  {
    label: 'Site Design',
    items: [
      { label: 'Theme Editor', href: '/admin/theme', icon: Palette },
      { label: 'Store', href: '/admin/store', icon: Store, adminOnly: true }
    ]
  },
  {
    label: 'Operations',
    items: [
      { label: 'Overview', href: '/admin', icon: LayoutDashboard, adminOnly: true },
      { label: 'Fleet', href: '/admin/fleet', icon: Radar, adminOnly: true },
      { label: 'Observability', href: '/admin/observability', icon: Gauge, adminOnly: true },
      { label: 'Alerts', href: '/admin/alertmanager/', icon: BellRing, adminOnly: true }
    ]
  },
  {
    label: 'Admin',
    items: [
      {
        label: 'Reviews',
        href: '/edit/reviews',
        icon: MessageSquare,
        pathPrefixes: ['/admin/review-links'],
        adminOnly: true
      },
      { label: 'Invite Reviewers', href: '/admin/review-links', icon: Users, adminOnly: true, requiresReviewModeAccess: true },
      { label: 'Users & Invitations', href: '/admin/users', icon: UserCog, adminOnly: true },
      { label: 'Approvals', href: '/admin/approvals', icon: Workflow, adminOnly: true },
      { label: 'Email Templates', href: '/edit/contact-templates', icon: BookCopy, adminOnly: true }
    ]
  }
];

export function AdminBrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5 text-white', compact ? 'py-1.5' : 'py-2')}>
      <Image
        src="/logo.webp"
        alt=""
        width={compact ? 28 : 32}
        height={compact ? 28 : 32}
        priority
        className={cn('shrink-0 object-contain', compact ? 'h-7 w-7' : 'h-8 w-8')}
      />
      <span className={cn('font-bold tracking-[0.01em]', compact ? 'text-[15px]' : 'text-base')}>
        Velvet Dinosaur
      </span>
    </div>
  );
}

/** Brand lockup for on-light surfaces (editor loading screen). */
export function EditorBrandLockup({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-[var(--vd-fg)]', className)}>
      <Image src="/logo.webp" alt="" width={24} height={24} className="h-6 w-6 object-contain" />
      <span className="text-sm font-bold tracking-[0.01em]">Velvet Dinosaur</span>
    </span>
  );
}
