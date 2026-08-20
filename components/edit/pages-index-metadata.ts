import {
  BarChart3,
  BookOpen,
  Briefcase,
  CalendarDays,
  FileText,
  FlaskConical,
  GraduationCap,
  Globe,
  Handshake,
  HeartPulse,
  Home,
  Hotel,
  Info,
  Leaf,
  Mail,
  Newspaper,
  Scale,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  type LucideIcon
} from 'lucide-react';
import type { PageRow } from '@/components/edit/pages-index-types';
import { sitePageFallbackTitle, slugToPathname } from '@/lib/site-pages';

type PageMetadata = {
  title?: string;
  description: string;
  icon: LucideIcon;
};

const PAGE_METADATA: Record<string, PageMetadata> = {
  home: {
    title: 'Home',
    description: 'Homepage highlights, featured content, and key entry points.',
    icon: Home
  },
  about: {
    title: 'About ASAP',
    description: 'Organization overview, mission, and history.',
    icon: Info
  },
  chapters: {
    title: 'Chapter Network',
    description: 'Global chapter presence, regional contacts, and chapter setup resources.',
    icon: Globe
  },
  board: {
    title: 'Our Board',
    description: 'Board members, governance leadership, and organizational oversight.',
    icon: Users
  },
  'advisory-board': {
    title: 'Advisory Board',
    description: 'Academic advisory board members and roles.',
    icon: GraduationCap
  },
  team: {
    title: 'Team',
    description: 'Core team members, collaborators, and contributors.',
    icon: User
  },
  members: {
    title: 'Members Directory',
    description: 'Directory of chapter members, profile cards, and links.',
    icon: Users
  },
  'members-list': {
    title: 'Members Directory (Legacy)',
    description: 'Legacy members directory slug kept for backwards compatibility.',
    icon: Users
  },
  connect: {
    title: 'Connect',
    description: 'Community engagement and collaboration opportunities.',
    icon: Handshake
  },
  contact: {
    title: 'Contact',
    description: 'Contact channels, inquiries, and outreach information.',
    icon: Mail
  },
  events: {
    title: 'Events',
    description: 'Upcoming events, talks, and public program sessions.',
    icon: CalendarDays
  },
  news: {
    title: 'News',
    description: 'Latest announcements, updates, and editorial stories.',
    icon: Newspaper
  },
  fellowship: {
    title: 'Fellowship',
    description: 'Fellowship program details, updates, and participation guidance.',
    icon: Sparkles
  },
  'our-work': {
    title: 'Our Work',
    description: 'Programs, initiatives, and strategic projects across ASAP.',
    icon: Briefcase
  },
  'our-work-journal': {
    title: 'Journal ASAP',
    description: 'Journal ASAP publications, commentary, and featured writing.',
    icon: BookOpen
  },
  'our-work-research': {
    title: 'Research',
    description: 'Research priorities, outputs, and collaboration tracks.',
    icon: FlaskConical
  },
  'our-work-impact': {
    title: 'Impact',
    description: 'Impact reporting, evidence, and performance outcomes.',
    icon: BarChart3
  },
  'our-work-health-impact-fund': {
    title: 'Health Impact Fund',
    description: 'Health Impact Fund program goals, evidence, and implementation updates.',
    icon: HeartPulse
  },
  'our-work-ecological-impact-fund': {
    title: 'Ecological Impact Fund',
    description: 'Ecological Impact Fund mission, methods, and progress updates.',
    icon: Leaf
  },
  privacy: {
    title: 'Privacy',
    description: 'Privacy terms, data handling, and user protections.',
    icon: ShieldCheck
  },
  terms: {
    title: 'Terms',
    description: 'Usage terms, legal policies, and participation conditions.',
    icon: Scale
  }
};

const DEFAULT_METADATA: PageMetadata = {
  description: 'Page content, layout, and publishing configuration.',
  icon: FileText
};

function humanizeSlug(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildPagePath(slug: string) {
  const mapped = slugToPathname(slug);
  if (mapped) return mapped;
  if (slug.startsWith('stay-')) return `/stays/${slug.slice(5)}`;
  return `/${slug}`;
}

function inferMetadata(slug: string): PageMetadata {
  if (slug.startsWith('stay-') || slug === 'stays') {
    return {
      title: humanizeSlug(slug),
      description: 'Accommodation page details, highlights, and publishing state.',
      icon: Hotel
    };
  }

  if (slug.startsWith('legal-') || slug.includes('privacy') || slug.includes('terms') || slug.includes('policy')) {
    return {
      title: humanizeSlug(slug),
      description: 'Legal and policy information for visitors and members.',
      icon: Scale
    };
  }

  return {
    ...DEFAULT_METADATA,
    title: humanizeSlug(slug)
  };
}

function resolveTitle(page: PageRow, slug: string, metadata: PageMetadata) {
  const authoredTitle = typeof page.title === 'string' ? page.title.trim() : '';
  if (authoredTitle) {
    const normalizedAuthored = authoredTitle.toLowerCase();
    const slugWithSpaces = slug.replaceAll('-', ' ');
    if (normalizedAuthored !== slug && normalizedAuthored !== slugWithSpaces) {
      return authoredTitle;
    }
  }

  if (metadata.title) return metadata.title;

  const fallback = sitePageFallbackTitle(slug).trim();
  if (!fallback || fallback.toLowerCase() === slug) {
    return humanizeSlug(slug);
  }
  return fallback;
}

export type ResolvedPageMetadata = {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
};

export function getPageMetadata(page: PageRow): ResolvedPageMetadata {
  const slug = page.slug.trim().toLowerCase();
  const metadata = PAGE_METADATA[slug] || inferMetadata(slug);
  return {
    title: resolveTitle(page, slug, metadata),
    description: metadata.description || DEFAULT_METADATA.description,
    icon: metadata.icon || DEFAULT_METADATA.icon,
    path: buildPagePath(slug)
  };
}
