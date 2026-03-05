export type PageRow = {
  slug: string;
  title?: string | null;
  updatedAt?: string | null;
  publishedAt?: string | null;
  draftUpdatedAt?: string | null;
};

export type SortKey = 'slug-asc' | 'draft-desc' | 'published-desc' | 'updated-desc';

export type ViewMode = 'grid' | 'list';

export type SectionKey = 'stays' | 'pages' | 'text';
