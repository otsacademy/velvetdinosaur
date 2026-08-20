export type PageRow = {
  slug: string;
  path?: string | null;
  title?: string | null;
  primaryChapterSlug?: string | null;
  chapterSlugs?: string[];
  primaryChapterName?: string | null;
  updatedAt?: string | null;
  publishedAt?: string | null;
  draftUpdatedAt?: string | null;
  pendingPublishRequestedAt?: string | null;
};

export type NewsArticleRow = {
  slug: string;
  title: string;
  tag: string;
  primaryChapterName?: string | null;
  date: string;
  authorName: string;
  status?: 'draft' | 'scheduled' | 'published';
  pendingPublishRequestedAt?: string | null;
  updatedAt?: string | null;
};

export type EventRow = {
  slug: string;
  title: string;
  category: string;
  primaryChapterName?: string | null;
  startDateTime: string;
  endDateTime: string;
  location: string;
  organizer: string;
  status?: 'draft' | 'published';
  featured?: boolean;
  updatedAt?: string | null;
};

export type SortKey = 'slug-asc' | 'draft-desc' | 'published-desc' | 'updated-desc';
export type NewsSortKey = 'updated-desc' | 'date-desc' | 'title-asc' | 'status-asc';
export type EventSortKey = 'updated-desc' | 'start-asc' | 'title-asc' | 'status-asc';

export type ViewMode = 'grid' | 'list';

export type ContentTab = 'pages' | 'news' | 'events';
