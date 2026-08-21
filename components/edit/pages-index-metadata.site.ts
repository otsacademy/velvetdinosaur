import { Briefcase, CalendarDays, Gauge, Home, Info, Mail, Newspaper, Scale, ShieldCheck, type LucideIcon } from 'lucide-react';

/**
 * Site-owned seam: friendly titles, descriptions, and icons for this site's
 * well-known page slugs, consumed by the core pages index.
 */
export type SitePageMetadata = {
  title?: string;
  description: string;
  icon: LucideIcon;
};

export const SITE_PAGE_METADATA: Record<string, SitePageMetadata> = {
  home: { title: 'Home', description: 'Homepage highlights, featured content, and key entry points.', icon: Home },
  about: { title: 'About', description: 'Studio overview, approach, and story.', icon: Info },
  work: { title: 'Work', description: 'Case studies and project highlights.', icon: Briefcase },
  audit: { title: 'Website Audit', description: 'The website audit offer and booking flow.', icon: Gauge },
  news: { title: 'News', description: 'Latest announcements, updates, and editorial stories.', icon: Newspaper },
  events: { title: 'Events', description: 'Upcoming events, talks, and sessions.', icon: CalendarDays },
  contact: { title: 'Contact', description: 'Contact channels, inquiries, and outreach information.', icon: Mail },
  privacy: { title: 'Privacy', description: 'Privacy terms, data handling, and user protections.', icon: ShieldCheck },
  terms: { title: 'Terms', description: 'Usage terms, legal policies, and participation conditions.', icon: Scale }
};

export function inferSitePageMetadata(_slug: string): SitePageMetadata | null {
  return null;
}
