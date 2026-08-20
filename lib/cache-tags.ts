const normalizeSlug = (slug: string) => slug.trim().toLowerCase();

export const pageTags = {
  content: 'pages:content',
  redirects: 'pages:redirects',
  list: (includeEmpty?: boolean) => (includeEmpty ? 'pages:list:all' : 'pages:list'),
  published: (slug: string) => `page:published:${normalizeSlug(slug)}`,
  draft: (slug: string) => `page:draft:${normalizeSlug(slug)}`,
  record: (slug: string) => `page:record:${normalizeSlug(slug)}`
};

export const themeTags = {
  current: 'theme:current',
  draft: 'theme:draft',
  default: 'theme:default'
};

export const newsTags = {
  content: 'news:content',
  list: 'news:list',
  cards: 'news:cards',
  article: (slug: string) => `news:article:${normalizeSlug(slug)}`
};

// Backwards compatible cache tag map used by some older sites.
// Prefer `pageTags` / `themeTags` for new code.
export const cacheTags = {
  pagesList: pageTags.list(),
  pagePublished: pageTags.published,
  pageDraft: pageTags.draft,
  pageRecord: pageTags.record,
  newsContent: newsTags.content,
  newsList: newsTags.list,
  newsArticle: newsTags.article,
  theme: themeTags.current,
  themeDraft: themeTags.draft,
  themeDefault: themeTags.default,
  staysList: 'stays:list',
  stay: (slug: string) => `stay:${normalizeSlug(slug)}`,
  advocatesList: 'advocates:list',
  advocate: (slug: string) => `advocate:${normalizeSlug(slug)}`,
  reviewsList: 'reviews:list',
  reviewsSource: (source: string) => `reviews:source:${normalizeSlug(source)}`,
  videosList: 'videos:list',
  videosCategory: (category: string) => `videos:category:${normalizeSlug(category)}`,
  contentStatus: 'content:status'
};
