'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import type { ArticleAuthorProfile } from '@/lib/articles';
import { getChapterName } from '@/lib/chapters';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function initials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return 'AS';
  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
}

const COUNTRY_CODE_ALIASES: Record<string, string> = {
  usa: 'US',
  'u.s.a.': 'US',
  'united states of america': 'US',
  us: 'US',
  uae: 'AE',
  uk: 'GB',
  gbr: 'GB',
  'u.k.': 'GB',
  england: 'GB',
  scotland: 'GB',
  wales: 'GB',
  'northern ireland': 'GB',
  russia: 'RU',
  'south korea': 'KR',
  'north korea': 'KP',
  vietnam: 'VN',
  'czech republic': 'CZ',
  czechia: 'CZ',
  'ivory coast': 'CI',
  "cote d'ivoire": 'CI',
  'cote divoire': 'CI',
  'dr congo': 'CD',
  drc: 'CD',
  'democratic republic of congo': 'CD',
  'democratic republic of the congo': 'CD',
  congo: 'CG',
  'republic of the congo': 'CG',
  'cape verde': 'CV',
  eswatini: 'SZ',
  swaziland: 'SZ',
  palestine: 'PS',
  kosovo: 'XK',
  laos: 'LA',
  moldova: 'MD',
  syria: 'SY',
  tanzania: 'TZ',
  bolivia: 'BO',
  venezuela: 'VE',
  iran: 'IR',
  'brunei darussalam': 'BN'
};

function normalizeCountryKey(value: string) {
  return clean(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[().,'’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const REGION_NAME_TO_CODE = (() => {
  const lookup = new Map<string, string>();
  if (typeof Intl === 'undefined' || typeof Intl.DisplayNames !== 'function') return lookup;

  const formatter = new Intl.DisplayNames(['en'], { type: 'region' });
  for (let first = 65; first <= 90; first += 1) {
    for (let second = 65; second <= 90; second += 1) {
      const code = String.fromCharCode(first, second);
      const label = formatter.of(code);
      if (!label || label === code) continue;
      lookup.set(normalizeCountryKey(label), code);
    }
  }

  return lookup;
})();

function resolveCountryCode(value: string) {
  const raw = clean(value);
  const normalized = normalizeCountryKey(raw);
  if (!normalized) return '';
  if (/^[a-z]{2}$/.test(normalized)) return normalized.toUpperCase();

  const uppercaseRaw = raw.toUpperCase();
  if (/^[A-Z]{2}$/.test(uppercaseRaw)) return uppercaseRaw;
  if (COUNTRY_CODE_ALIASES[normalized]) return COUNTRY_CODE_ALIASES[normalized];
  // Handles values like "United Kingdom (UK)" and "Congo, Democratic Republic of the"
  const noParen = normalizeCountryKey(raw.replace(/\(.*?\)/g, ''));
  if (COUNTRY_CODE_ALIASES[noParen]) return COUNTRY_CODE_ALIASES[noParen];
  if (REGION_NAME_TO_CODE.get(noParen)) return REGION_NAME_TO_CODE.get(noParen) || '';

  return REGION_NAME_TO_CODE.get(normalized) || '';
}

function countryToFlagEmoji(value: string) {
  const code = resolveCountryCode(value);
  if (!/^[A-Z]{2}$/.test(code)) return '';
  return String.fromCodePoint(...code.split('').map((char) => 127397 + char.charCodeAt(0)));
}

export function formatAuthorDisplayName(name: string, profile?: ArticleAuthorProfile | null) {
  const fallbackName = clean(name) || 'ASAP Staff';
  if (!profile) return fallbackName;

  const canonicalName = `${clean(profile.firstName)} ${clean(profile.lastName)}`.replace(/\s+/g, ' ').trim();
  const base = canonicalName || clean(profile.displayName) || fallbackName;
  const title = clean(profile.academicTitle);
  return title ? `${title} ${base}` : base;
}

export function formatAuthorAffiliation(profile?: ArticleAuthorProfile | null, chapterNameOverride?: string | null) {
  const chapterName =
    clean(chapterNameOverride) ||
    clean(profile?.primaryChapterName) ||
    getChapterName(clean(profile?.primaryChapterSlug));
  const institution = clean(profile?.institution);
  const country = clean(profile?.country) || clean(profile?.location);
  if (!chapterName && !institution && !country) return '';
  return [chapterName, institution, country].filter(Boolean).join(' · ');
}

type AuthorHoverCardProps = {
  authorName: string;
  authorImage?: string;
  profile?: ArticleAuthorProfile | null;
  chapterName?: string | null;
  children: ReactNode;
};

export function AuthorHoverCard({ authorName, authorImage, profile, chapterName, children }: AuthorHoverCardProps) {
  const displayName = formatAuthorDisplayName(authorName, profile);
  const resolvedChapterName =
    clean(chapterName) ||
    clean(profile?.primaryChapterName) ||
    getChapterName(clean(profile?.primaryChapterSlug));
  const institution = clean(profile?.institution);
  const department = clean(profile?.department);
  const country = clean(profile?.country) || clean(profile?.location);
  const bio = clean(profile?.bio);
  const orcidUrl = clean(profile?.orcidUrl) || (clean(profile?.orcidId) ? `https://orcid.org/${clean(profile?.orcidId)}` : '');
  const scholarUrl = clean(profile?.scholarUrl);
  const avatarSrc = clean(authorImage);
  const countryFlag = countryToFlagEmoji(country);

  const hasHoverContent = Boolean(
    resolvedChapterName || institution || department || country || bio || orcidUrl || scholarUrl || clean(profile?.displayName)
  );

  if (!hasHoverContent) {
    return <>{children}</>;
  }

  return (
    <HoverCard openDelay={160} closeDelay={120}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-[22rem] space-y-4" sideOffset={10}>
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 border border-border/70">
            <AvatarImage src={avatarSrc} alt={displayName} className="object-cover" />
            <AvatarFallback className="bg-primary text-xs text-primary-foreground">{initials(displayName)}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">{displayName}</p>
            {resolvedChapterName ? (
              <p className="text-xs font-medium text-foreground/85">{resolvedChapterName}</p>
            ) : null}
            {department || institution ? (
              <p className="text-xs text-muted-foreground">{[department, institution].filter(Boolean).join(' · ')}</p>
            ) : null}
          </div>
        </div>

        {bio ? <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{bio}</p> : null}

        {country || orcidUrl || scholarUrl ? (
          <div className="space-y-2 border-t border-border/70 pt-3 text-xs text-muted-foreground">
            {country ? (
              <p className="flex items-center gap-2">
                <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center text-xs leading-none" aria-hidden="true">
                  {countryFlag || '🏳️'}
                </span>
                <span>{country}</span>
              </p>
            ) : null}
            {orcidUrl ? (
              <a
                href={orcidUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-foreground transition-colors hover:text-accent"
              >
                <Image
                  src="/images/brand/orcid.svg"
                  alt=""
                  aria-hidden="true"
                  width={14}
                  height={14}
                  className="h-3.5 w-3.5 shrink-0"
                />
                <span>ORCID profile</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
            {scholarUrl ? (
              <a
                href={scholarUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-foreground transition-colors hover:text-accent"
              >
                <Image
                  src="/images/brand/google-scholar.svg"
                  alt=""
                  aria-hidden="true"
                  width={14}
                  height={14}
                  className="h-3.5 w-3.5 shrink-0"
                />
                <span>Google Scholar</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
          </div>
        ) : null}
      </HoverCardContent>
    </HoverCard>
  );
}
