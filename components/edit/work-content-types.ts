/**
 * Velvet Dinosaur's site-owned content-type rows for the Work (case studies)
 * tab, kept beside the core pages-index-types the edit-index engine uses.
 */
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

export type SectionKey = 'stays' | 'pages' | 'text' | 'work' | 'news' | 'events';
