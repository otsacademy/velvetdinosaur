import type { NewsEditorDocumentSettings } from '@/lib/news-editor-document-settings';

export type ArticleCallout = {
  title: string;
  description: string;
};

export type ArticleTable = {
  headers: [string, string];
  rows: Array<[string, string]>;
};

export type ArticleSection = {
  id?: string;
  heading: string;
  paragraphs: string[];
  quote?: string;
  listItems?: string[];
  table?: ArticleTable;
  alert?: ArticleCallout;
};

export type ArticleAuthorProfile = {
  userId: string;
  displayName: string;
  firstName: string;
  lastName: string;
  academicTitle: string;
  primaryChapterSlug: string;
  primaryChapterName?: string;
  chapterSlugs: string[];
  institution: string;
  department: string;
  country: string;
  location: string;
  bio: string;
  orcidId: string;
  orcidUrl: string;
  scholarUrl: string;
};

export type ArticleChapterSnapshot = {
  primaryChapterSlug: string;
  primaryChapterName: string;
  chapterSlugs: string[];
  capturedAt?: string | null;
};

export type ArticleHeroImage = {
  fit?: 'cover' | 'contain';
  width?: number;
  height?: number;
  alt?: string;
};

export type ArticlePageSpeedSnapshot = {
  title: string;
  description: string;
  capturedAt: string;
  reportUrl: string;
  reportLabel?: string;
  image: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  scores: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
};

export interface Article {
  slug: string;
  img: string;
  tag: string;
  tags?: string[];
  title: string;
  desc: string;
  date: string;
  readTime?: string;
  imageCaption?: string;
  heroImage?: ArticleHeroImage;
  pageSpeedSnapshot?: ArticlePageSpeedSnapshot;
  subtitle?: string;
  website?: string;
  outcome?: string;
  author: { img: string; name: string };
  authorUserId?: string | null;
  primaryChapterSlug?: string;
  primaryChapterName?: string;
  chapterSlugs?: string[];
  chapterSnapshot?: ArticleChapterSnapshot | null;
  authorProfile?: ArticleAuthorProfile | null;
  authorSnapshot?: { img: string; name: string; capturedAt?: string | null } | null;
  status?: 'draft' | 'scheduled' | 'published';
  publishAt?: string;
  sections?: ArticleSection[];
  content: {
    intro: string;
    heroImg: string;
    sections: {
      id: string;
      title: string;
      body: string;
    }[];
  };
  openGraphTitle?: string;
  openGraphDescription?: string;
  openGraphImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoSource?: 'manual' | 'auto' | null;
  seoGeneratedAt?: string | null;
  seoModel?: string | null;
  seoNeedsReview?: boolean;
  editorSettings?: NewsEditorDocumentSettings;
}

export type PublicNewsCard = Pick<
  Article,
  | 'slug'
  | 'img'
  | 'tag'
  | 'tags'
  | 'title'
  | 'desc'
  | 'date'
  | 'readTime'
  | 'imageCaption'
  | 'author'
  | 'authorUserId'
  | 'primaryChapterSlug'
  | 'primaryChapterName'
  | 'chapterSlugs'
  | 'chapterSnapshot'
  | 'authorProfile'
  | 'authorSnapshot'
  | 'status'
  | 'publishAt'
  | 'openGraphTitle'
  | 'openGraphDescription'
  | 'openGraphImage'
  | 'twitterTitle'
  | 'twitterDescription'
  | 'twitterImage'
>;

// Sample articles used to be ASAP's own news. Nothing reads them; articles
// come from the database.
export const ALL_ARTICLES: Article[] = [];

export function getArticleBySlug(slug: string): Article | undefined {
  return ALL_ARTICLES.find((a) => a.slug === slug)
}

export const TAGS = ["All", "News", "Events", "Announcements", "Updates"]
