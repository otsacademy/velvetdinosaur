import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ExternalLink } from 'lucide-react'

import type { Article } from '@/lib/articles'
import { listLatestPublishedWorkArticles } from '@/lib/work-articles.server'
import { cn } from '@/lib/utils'

function WorkCard({
  article,
  index,
}: {
  article: Article
  index: number
}) {
  const isFeatured = index === 0
  const secondaryTag = article.tags?.find((tag) => tag !== article.tag) || article.readTime

  return (
    <article
      className={cn(
        'vd-hover-lift vd-work-card group overflow-hidden border border-border/75 bg-card/92',
        'rounded-[calc(var(--vd-radius)+12px)]',
        isFeatured && 'xl:col-span-6 xl:grid xl:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.92fr)]',
        !isFeatured && 'xl:col-span-2',
      )}
    >
      <div
        className={cn(
          'vd-work-media relative w-full overflow-hidden bg-muted',
          isFeatured ? 'aspect-[16/10] xl:order-2 xl:aspect-auto xl:min-h-[22rem]' : 'aspect-[16/10]',
        )}
      >
        <Image
          src={article.img || '/placeholder.svg'}
          alt={article.imageCaption || article.title}
          fill
          sizes={
            isFeatured
              ? '(max-width: 1280px) 100vw, 48vw'
              : '(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw'
          }
          className="object-cover object-top"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,transparent_52%,color-mix(in_oklch,var(--vd-bg)_92%,transparent)_100%)]" />
        {article.website ? (
          <a
            href={article.website}
            target="_blank"
            rel="noreferrer"
            className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-primary/25 bg-background/85 px-2.5 py-1 text-[11px] font-medium text-foreground"
          >
            Live project
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
      </div>

      <div className={cn('flex flex-col justify-between gap-5 p-5 sm:p-6', isFeatured && 'xl:p-8')}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-foreground/82">
              {isFeatured ? 'Featured case study' : article.tag}
            </span>
            {secondaryTag ? <span>{secondaryTag}</span> : null}
          </div>
          <div className="space-y-2">
            <h3
              className={cn(
                'text-xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary',
                isFeatured && 'text-2xl sm:text-[2rem]',
              )}
            >
              {article.title}
            </h3>
            {article.subtitle ? (
              <p
                className={cn(
                  'text-sm leading-relaxed text-muted-foreground',
                  isFeatured && 'max-w-[34rem] text-base',
                )}
              >
                {article.subtitle}
              </p>
            ) : null}
          </div>
          <p className={cn('text-sm leading-relaxed text-foreground/78', isFeatured && 'max-w-[36rem] text-base')}>
            {article.desc}
          </p>
        </div>
        {article.outcome ? (
          <div className="rounded-[calc(var(--vd-radius)+8px)] border border-border/65 bg-background/62 p-4 shadow-[0_18px_32px_-30px_color-mix(in_oklch,var(--vd-fg)_20%,transparent)] transition-colors duration-300 group-hover:border-primary/18 group-hover:bg-background/82">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Outcome</p>
            <p className={cn('mt-2 text-sm leading-relaxed text-foreground/82', isFeatured && 'text-base')}>
              {article.outcome}
            </p>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/work/${article.slug}`}
            aria-label={`Read more about ${article.title}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-foreground transition-transform duration-200 group-hover:translate-x-0.5"
          >
            Read case study
            <span className="sr-only"> about {article.title}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          {article.website ? (
            <a
              href={article.website}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Visit site
            </a>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export async function SelectedWork() {
  const workItems = await listLatestPublishedWorkArticles(4)

  return (
    <section id="portfolio" className="pb-10 pt-2 md:pb-12 md:pt-4">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-8 space-y-3 md:mb-10">
          <h2 className="vd-section-heading text-2xl font-semibold tracking-tight md:text-[2.2rem]">
            Selected work
          </h2>
          <p className="max-w-2xl text-[15px] leading-relaxed text-foreground/76">
            Real projects across charities, service businesses, and product platforms.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-6">
          {workItems.map((article, index) => (
            <WorkCard key={article.slug} article={article} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
