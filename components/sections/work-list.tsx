'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import type { Article } from '@/lib/articles'
import { createArticleExcerpt, normalizeArticleAuthor } from '@/lib/work-presentation'
import { focalToObjectPosition, parseFocalFromUrl } from '@/lib/media/focal-point'
import { formatWorkCardDate } from '@/components/work/format-card-date'
import { WorkChapterBadge } from '@/components/work/work-chapter-badge'
import { ReadArticleCta } from '@/components/work/read-article-cta'
import {
  AuthorHoverCard,
  formatAuthorAffiliation,
  formatAuthorDisplayName
} from '@/components/work/author-hover-card.client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

type WorkListProps = {
  articles: Article[]
  tags: string[]
  initialCount?: number
  incrementCount?: number
  showFeatured?: boolean
}
const DEFAULT_AUTHOR_IMAGE = '/dinosaur.webp'
const DEFAULT_NEWS_IMAGE = '/images/placeholder.svg'
const DEFAULT_INITIAL_COUNT = 12
const DEFAULT_INCREMENT_COUNT = 12

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase()
}

function authorAvatarImageClass(src: string) {
  return src.trim() === DEFAULT_AUTHOR_IMAGE ? 'object-contain p-1' : 'object-cover'
}

function normalizeWorkImageSource(src?: string) {
  const value = typeof src === 'string' ? src.trim() : ''
  return value || DEFAULT_NEWS_IMAGE
}

function usesContainedWorkImage(article: Article) {
  return article.heroImage?.fit === 'contain'
}

function workImageFrameClass(article: Article, className?: string) {
  return cn(
    'relative aspect-video overflow-hidden',
    usesContainedWorkImage(article)
      ? 'bg-[color-mix(in_oklch,var(--vd-muted)_70%,var(--vd-bg))] ring-1 ring-inset ring-[color-mix(in_oklch,var(--vd-border)_72%,transparent)]'
      : null,
    className
  )
}

function workImageClass(article: Article, className?: string) {
  return cn(
    usesContainedWorkImage(article) ? 'object-contain p-3 sm:p-4' : 'object-cover',
    className
  )
}

type WorkCardImageProps = {
  src?: string
  alt: string
  className: string
  loading?: 'eager' | 'lazy'
  priority?: boolean
  sizes: string
}

function WorkCardImage({ src, alt, className, loading, priority, sizes }: WorkCardImageProps) {
  const normalizedSource = normalizeWorkImageSource(src)
  const [resolvedSource, setResolvedSource] = useState(normalizedSource)

  useEffect(() => {
    setResolvedSource(normalizedSource)
  }, [normalizedSource])

  return (
    <Image
      alt={alt}
      className={className}
      fill
      loading={priority ? undefined : loading}
      priority={priority}
      sizes={sizes}
      src={resolvedSource}
      style={{ objectPosition: focalToObjectPosition(parseFocalFromUrl(resolvedSource)) }}
      onError={() => {
        setResolvedSource((current) => (current === DEFAULT_NEWS_IMAGE ? current : DEFAULT_NEWS_IMAGE))
      }}
    />
  )
}

export function WorkList({
  articles,
  tags,
  initialCount = DEFAULT_INITIAL_COUNT,
  incrementCount = DEFAULT_INCREMENT_COUNT,
  showFeatured = true,
}: WorkListProps) {
  const [activeTag, setActiveTag] = useState('All')
  const normalizedInitialCount = Number.isFinite(initialCount) && initialCount > 0
    ? Math.floor(initialCount)
    : DEFAULT_INITIAL_COUNT
  const normalizedIncrementCount = Number.isFinite(incrementCount) && incrementCount > 0
    ? Math.floor(incrementCount)
    : DEFAULT_INCREMENT_COUNT
  const [visibleCountByTag, setVisibleCountByTag] = useState<Record<string, number>>(() => ({
    All: normalizedInitialCount
  }))

  const normalizedArticles = useMemo(
    () =>
      articles.map((article) => ({
        ...article,
        author: normalizeArticleAuthor(article.author)
      })),
    [articles]
  )

  const filtered = useMemo(() => {
    if (activeTag === 'All') return normalizedArticles
    return normalizedArticles.filter((article) => article.tag === activeTag)
  }, [activeTag, normalizedArticles])

  const visibleCount = visibleCountByTag[activeTag] ?? normalizedInitialCount
  const hasFeatured = showFeatured && filtered.length > 0 && visibleCount > 0
  const featuredArticle = hasFeatured ? filtered[0] : null
  const regularArticles = hasFeatured ? filtered.slice(1) : filtered
  const visibleRegularCount = Math.max(0, visibleCount - (hasFeatured ? 1 : 0))
  const visibleRegularArticles = regularArticles.slice(0, visibleRegularCount)
  const renderedTotal = (featuredArticle ? 1 : 0) + visibleRegularArticles.length
  const hasMore = filtered.length > renderedTotal
  if (articles.length === 0) {
    return (
      <section className="bg-background py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-lg border border-border bg-card p-8">
            <h2 className="text-xl font-semibold text-card-foreground">No work published yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Go to <code>/edit</code>, click <strong>New work</strong>, and publish your first case study.
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-background py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-6">
        {tags.length > 1 ? (
          <div className="mb-12 flex flex-wrap items-center gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setActiveTag(tag)
                  setVisibleCountByTag((current) =>
                    current[tag]
                      ? current
                      : {
                          ...current,
                          [tag]: normalizedInitialCount
                        }
                  )
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeTag === tag
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        ) : null}

        {filtered.length > 0 ? (
          <>
            {featuredArticle ? (
              <div className="mb-12">
                <Link href={`/work/${featuredArticle.slug}`} className="group">
                  <Card className="overflow-hidden py-0 transition-all group-hover:border-accent/30 group-hover:shadow-lg">
                    <div className="grid md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
                      <div className={workImageFrameClass(featuredArticle)}>
                        <WorkCardImage
                          alt={featuredArticle.title}
                          className={workImageClass(
                            featuredArticle,
                            'transition-transform duration-300 group-hover:scale-105'
                          )}
                          priority
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 58vw, 46vw"
                          src={featuredArticle.img}
                        />
                      </div>
                      <div className="flex flex-col justify-center p-8 lg:p-12">
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                          <Badge
                            className="bg-secondary text-secondary-foreground"
                            variant="secondary"
                          >
                            {featuredArticle.tag}
                          </Badge>
                          <WorkChapterBadge chapterName={featuredArticle.primaryChapterName} />
                        </div>
                        <h2 className="mb-4 font-serif text-2xl font-bold text-card-foreground transition-colors group-hover:text-accent lg:text-3xl">
                          <span className="text-pretty">{featuredArticle.title}</span>
                        </h2>
                        <p className="mb-6 leading-relaxed text-muted-foreground">
                          {createArticleExcerpt(featuredArticle.desc, { maxChars: 240, preferSentence: true })}
                        </p>
                        <div className="flex items-center justify-between gap-3">
                          <AuthorHoverCard
                            authorName={featuredArticle.author.name}
                            authorImage={featuredArticle.author.img}
                            profile={featuredArticle.authorProfile}
                            chapterName={featuredArticle.primaryChapterName}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 border border-border/60">
                                <AvatarImage
                                  alt={featuredArticle.author.name}
                                  src={featuredArticle.author.img}
                                  className={authorAvatarImageClass(featuredArticle.author.img)}
                                />
                                <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                                  {initials(featuredArticle.author.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-semibold text-card-foreground">
                                  {formatAuthorDisplayName(featuredArticle.author.name, featuredArticle.authorProfile)}
                                </p>
                                {formatAuthorAffiliation(featuredArticle.authorProfile, featuredArticle.primaryChapterName) ? (
                                  <p className="text-xs text-muted-foreground">
                                    {formatAuthorAffiliation(featuredArticle.authorProfile, featuredArticle.primaryChapterName)}
                                  </p>
                                ) : null}
                                <p className="text-xs text-muted-foreground">
                                  {formatWorkCardDate(featuredArticle.date)}
                                </p>
                              </div>
                            </div>
                          </AuthorHoverCard>
                          <ReadArticleCta className="shrink-0" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </div>
            ) : null}

            <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visibleRegularArticles.map((article, index) => (
                <Link key={article.slug} href={`/work/${article.slug}`} className="group">
                  <Card className="h-full overflow-hidden py-0 transition-all group-hover:border-accent/30 group-hover:shadow-lg">
                    <CardHeader className="p-4 pb-0">
                      <div className={workImageFrameClass(article, 'w-full rounded-lg')}>
                        <WorkCardImage
                          alt={article.title}
                          className={workImageClass(
                            article,
                            'object-center transition-transform duration-300 group-hover:scale-105'
                          )}
                          loading={index < 3 ? 'eager' : 'lazy'}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          src={article.img}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="px-6">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge
                          className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
                          variant="secondary"
                        >
                          {article.tag}
                        </Badge>
                        <WorkChapterBadge chapterName={article.primaryChapterName} />
                      </div>
                      <CardTitle className="mb-2 text-lg leading-snug transition-colors group-hover:text-accent">
                        {article.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-3 leading-relaxed">
                        {createArticleExcerpt(article.desc, { maxChars: 145, preferSentence: true })}
                      </CardDescription>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between gap-4 p-6 pt-0">
                      <AuthorHoverCard
                        authorName={article.author.name}
                        authorImage={article.author.img}
                        profile={article.authorProfile}
                        chapterName={article.primaryChapterName}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-border/60">
                            <AvatarImage
                              alt={article.author.name}
                              src={article.author.img}
                              className={authorAvatarImageClass(article.author.img)}
                            />
                            <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                              {initials(article.author.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-0.5">
                            <p className="text-sm font-semibold text-foreground">
                              {formatAuthorDisplayName(article.author.name, article.authorProfile)}
                            </p>
                            {formatAuthorAffiliation(article.authorProfile, article.primaryChapterName) ? (
                              <p className="text-xs text-muted-foreground">
                                {formatAuthorAffiliation(article.authorProfile, article.primaryChapterName)}
                              </p>
                            ) : null}
                            <p className="text-xs text-muted-foreground">
                              {formatWorkCardDate(article.date)}
                            </p>
                          </div>
                        </div>
                      </AuthorHoverCard>
                      <ReadArticleCta className="shrink-0" />
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
            {hasMore ? (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={() =>
                    setVisibleCountByTag((current) => ({
                      ...current,
                      [activeTag]: (current[activeTag] ?? normalizedInitialCount) + normalizedIncrementCount
                    }))
                  }
                  className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Load more articles
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="rounded-lg border border-border bg-card p-8">
            <h2 className="text-xl font-semibold text-card-foreground">No matches</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              No articles are available for the selected tag.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
