import type { Metadata } from 'next';
import type { Article } from '@/lib/articles';
import { resolveSiteUrl, siteName } from '@/lib/site-metadata';

const DESCRIPTION_TARGET_LENGTH = 220;
const DESCRIPTION_MAX_LENGTH = 260;

function cleanText(value: string | null | undefined) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

function splitIntoSentences(value: string) {
  return cleanText(value)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  const shortened = value.slice(0, maxLength - 1).trimEnd();
  const lastSpaceIndex = shortened.lastIndexOf(' ');
  const safeCut = lastSpaceIndex > 80 ? shortened.slice(0, lastSpaceIndex) : shortened;
  return `${safeCut}...`;
}

function buildSentenceExcerpt(sentences: string[]) {
  let excerpt = '';

  for (const sentence of sentences) {
    const next = excerpt ? `${excerpt} ${sentence}` : sentence;
    if (next.length > DESCRIPTION_MAX_LENGTH && excerpt) {
      break;
    }

    excerpt = next;

    if (excerpt.length >= DESCRIPTION_TARGET_LENGTH) {
      break;
    }
  }

  return truncateText(excerpt, DESCRIPTION_MAX_LENGTH);
}

function collectArticleSentences(article: Article) {
  const sources = [
    article.content.intro,
    ...(article.sections?.flatMap((section) => section.paragraphs) ?? []),
    ...article.content.sections.map((section) => section.body),
    article.desc,
    article.outcome,
  ];

  const seen = new Set<string>();
  const sentences: string[] = [];

  for (const source of sources) {
    for (const sentence of splitIntoSentences(source || '')) {
      const key = sentence.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      sentences.push(sentence);
    }
  }

  return sentences;
}

export function buildWorkArticleSocialDescription(article: Article) {
  const manualDescription =
    cleanText(article.openGraphDescription) ||
    cleanText(article.twitterDescription) ||
    cleanText(article.seoDescription);

  if (manualDescription) {
    return manualDescription;
  }

  const excerpt = buildSentenceExcerpt(collectArticleSentences(article));
  return excerpt || cleanText(article.desc) || cleanText(article.outcome) || article.title;
}

function resolveAbsoluteUrl(value: string | null | undefined) {
  const cleaned = cleanText(value);
  if (!cleaned) return undefined;

  try {
    return new URL(cleaned).toString();
  } catch {
    return new URL(cleaned.startsWith('/') ? cleaned : `/${cleaned}`, `${resolveSiteUrl()}/`).toString();
  }
}

export function resolveWorkArticleSocialImage(article: Article) {
  return resolveAbsoluteUrl(
    article.openGraphImage || article.twitterImage || article.content.heroImg || article.img,
  );
}

export function resolveWorkArticleCanonicalUrl(slug: string) {
  return new URL(`/work/${slug}`, `${resolveSiteUrl()}/`).toString();
}

export function buildWorkArticleMetadata(article: Article): Metadata {
  const canonical = resolveWorkArticleCanonicalUrl(article.slug);
  const socialDescription = buildWorkArticleSocialDescription(article);
  const metadataDescription = cleanText(article.seoDescription) || socialDescription;
  const socialImage = resolveWorkArticleSocialImage(article);
  const socialImageAlt =
    cleanText(article.heroImage?.alt) || cleanText(article.imageCaption) || `${article.title} hero image`;
  const openGraphTitle = cleanText(article.openGraphTitle) || cleanText(article.seoTitle) || article.title;
  const twitterTitle =
    cleanText(article.twitterTitle) || cleanText(article.openGraphTitle) || cleanText(article.seoTitle) || article.title;
  const authorName = cleanText(article.author?.name);

  return {
    title: cleanText(article.seoTitle) || article.title,
    description: metadataDescription,
    alternates: {
      canonical,
    },
    authors: authorName ? [{ name: authorName }] : undefined,
    creator: authorName || undefined,
    openGraph: {
      type: 'article',
      url: canonical,
      siteName,
      title: openGraphTitle,
      description: cleanText(article.openGraphDescription) || socialDescription,
      images: socialImage
        ? [
            {
              url: socialImage,
              alt: socialImageAlt,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: twitterTitle,
      description: cleanText(article.twitterDescription) || cleanText(article.openGraphDescription) || socialDescription,
      images: socialImage ? [socialImage] : undefined,
    },
  };
}
