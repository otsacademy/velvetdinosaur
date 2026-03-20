export type PageRow = {
  slug: string;
  title?: string | null;
  updatedAt?: string | null;
  publishedAt?: string | null;
  draftUpdatedAt?: string | null;
};

export type WorkArticleRow = {
  slug: string;
  title: string;
  tag: string;
  authorName: string;
  status: 'draft' | 'scheduled' | 'published';
  date: string;
  updatedAt?: string | null;
  pendingPublishRequestedAt?: string | null;
};

export type SortKey = 'slug-asc' | 'draft-desc' | 'published-desc' | 'updated-desc';

export type ViewMode = 'grid' | 'list';

export type SectionKey = 'stays' | 'pages' | 'text' | 'work';
