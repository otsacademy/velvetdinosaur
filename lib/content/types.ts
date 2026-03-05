export type LinkTarget = '_self' | '_blank';

export type CTA = {
  label: string;
  href: string;
  target?: LinkTarget;
  rel?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'link';
};

export type StayAddress = {
  address?: string;
  city?: string;
  area?: string;
  county?: string;
  state?: string;
  country?: string;
  zip?: string;
};

export type StayDetails = {
  guests?: number;
  bedrooms?: number;
  bathrooms?: number;
  size?: string;
  externalId?: number;
};

export type Stay = {
  slug: string;
  sortOrder?: number;
  name: string;
  location?: string;
  type?: string;
  summary?: string;
  description?: string;
  heroImage?: string;
  gallery?: string[];
  videoId?: string;
  price?: number;
  currency?: string;
  isStartingFrom?: boolean;
  badges?: string[];
  amenities?: string[];
  policies?: string[];
  ctas?: CTA[];
  details?: StayDetails;
  address?: StayAddress;
  metaNote?: string;
};

export type Review = {
  slug: string;
  author: string;
  role?: string;
  dateLabel?: string;
  content: string;
  avatar?: string;
  source?: 'linkedin' | 'testimonial' | 'note' | 'phone' | 'google';
  highlight?: boolean;
  rating?: number;
};

export type Advocate = {
  slug: string;
  name: string;
  location?: string;
  description?: string;
  website?: string;
  category?: 'cultural' | 'nature' | 'wellbeing' | 'tour' | 'stays' | 'charity';
  cta?: CTA;
  tags?: string[];
};

export type VideoAsset = {
  slug: string;
  title: string;
  description?: string;
  platform?: 'youtube' | 'tiktok' | 'vimeo' | 'direct';
  videoId?: string;
  url?: string;
  thumbnail?: string;
  category?: 'about' | 'short' | 'showcase';
  author?: string;
  likes?: number;
  shares?: number;
};

export type ShortsOpenPayload = {
  shorts: VideoAsset[];
  startSlug?: string;
};

