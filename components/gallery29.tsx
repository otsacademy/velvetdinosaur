import Image from 'next/image'
import { ArrowRight, ExternalLink } from 'lucide-react'

import type { Article } from '@/lib/articles'
import { Marquee } from '@/components/ui/marquee'
import { cn } from '@/lib/utils'

type Gallery29Props = {
  className?: string
  items: Article[]
  title?: string
  description?: string
}

function getSecondaryTag(article: Article) {
  return article.tags?.find((tag) => tag !== article.tag) || article.readTime
}

function ProjectThumb({ article }: { article: Article }) {
  return (
    <div className="w-56 shrink-0 overflow-hidden rounded-[calc(var(--vd-radius)+10px)] border border-[color-mix(in_oklch,var(--vd-border)_74%,transparent)] bg-background/88 shadow-[0_16px_40px_-30px_color-mix(in_oklch,var(--vd-fg)_24%,transparent)]">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={article.img}
          alt={article.imageCaption || article.title}
          fill
          sizes="224px"
          className="object-cover object-top"
        />
      </div>
      <div className="space-y-1 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--vd-muted-fg)]">
          {getSecondaryTag(article) || article.tag}
        </p>
        <p className="text-sm font-medium text-foreground">{article.title}</p>
      </div>
    </div>
  )
}

function WorkActions({ article }: { article: Article }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <a
        href={`/work/${article.slug}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-foreground transition-colors duration-200 hover:text-primary"
      >
        Read case study
        <span className="sr-only"> about {article.title}</span>
        <ArrowRight className="h-4 w-4 vd-inline-arrow" />
      </a>
      {article.website ? (
        <a
          href={article.website}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-[var(--vd-muted-fg)] transition-colors hover:text-foreground"
        >
          Visit site
        </a>
      ) : null}
    </div>
  )
}

function FeaturedProject({ article }: { article: Article }) {
  const secondaryTag = getSecondaryTag(article)

  return (
    <article className="grid gap-6 rounded-[calc(var(--vd-radius)+14px)] border border-[color-mix(in_oklch,var(--vd-border)_80%,transparent)] bg-[color-mix(in_oklch,var(--vd-card)_96%,var(--vd-bg))] p-4 shadow-[0_28px_80px_-48px_color-mix(in_oklch,var(--vd-fg)_24%,transparent)] sm:p-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)] lg:p-6">
      <div className="relative overflow-hidden rounded-[calc(var(--vd-radius)+10px)] border border-[color-mix(in_oklch,var(--vd-border)_72%,transparent)] bg-muted">
        <div className="relative aspect-[16/10]">
        <Image
          src={article.img}
          alt={article.imageCaption || article.title}
          fill
          sizes="(max-width: 1024px) 100vw, 54vw"
          className="object-cover object-top"
        />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,transparent_56%,color-mix(in_oklch,var(--vd-bg)_88%,transparent)_100%)]" />
        {article.website ? (
          <a
            href={article.website}
            target="_blank"
            rel="noreferrer"
            className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-[color-mix(in_oklch,var(--vd-border)_72%,transparent)] bg-background/92 px-2.5 py-1 text-[11px] font-medium text-[var(--vd-muted-fg)]"
          >
            Live project
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
      </div>

      <div className="flex flex-col justify-between gap-5">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--vd-muted-fg)]">
            <span className="rounded-full border border-transparent bg-background/72 px-3 py-1 text-[var(--vd-muted-fg)]">
              Featured case study
            </span>
            {secondaryTag ? <span>{secondaryTag}</span> : null}
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
              {article.title}
            </h3>
            {article.subtitle ? (
              <p className="max-w-[34rem] text-base leading-relaxed text-[var(--vd-muted-fg)]">
                {article.subtitle}
              </p>
            ) : null}
          </div>
          <p className="max-w-[36rem] text-base leading-relaxed text-[var(--vd-copy)]">{article.desc}</p>
        </div>

        {article.outcome ? (
          <div className="rounded-[calc(var(--vd-radius)+6px)] border border-[color-mix(in_oklch,var(--vd-border)_78%,transparent)] bg-background/78 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--vd-muted-fg)]">Outcome</p>
            <p className="mt-2 text-base leading-relaxed text-[var(--vd-copy)]">{article.outcome}</p>
          </div>
        ) : null}

        <WorkActions article={article} />
      </div>
    </article>
  )
}

function SecondaryProject({ article }: { article: Article }) {
  const secondaryTag = getSecondaryTag(article)

  return (
    <article className="vd-hover-lift vd-work-card group overflow-hidden rounded-[calc(var(--vd-radius)+10px)] border border-transparent bg-card hover:bg-accent hover:shadow-[0_1px_6px_color-mix(in_oklch,var(--vd-fg)_8%,transparent)]">
      <div className="vd-work-media relative aspect-[16/10] overflow-hidden bg-muted">
        <Image
          src={article.img}
          alt={article.imageCaption || article.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover object-top"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,transparent_52%,color-mix(in_oklch,var(--vd-bg)_92%,transparent)_100%)]" />
        {article.website ? (
          <a
            href={article.website}
            target="_blank"
            rel="noreferrer"
            className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-[color-mix(in_oklch,var(--vd-border)_72%,transparent)] bg-background/92 px-2.5 py-1 text-[11px] font-medium text-[var(--vd-muted-fg)]"
          >
            Live project
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
      </div>

      <div className="flex h-full flex-col justify-between gap-5 p-5 sm:p-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--vd-muted-fg)]">
            <span className="rounded-full border border-transparent bg-background/72 px-3 py-1 text-[var(--vd-muted-fg)]">
              {article.tag}
            </span>
            {secondaryTag ? <span>{secondaryTag}</span> : null}
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
              {article.title}
            </h3>
            {article.subtitle ? (
              <p className="text-sm leading-relaxed text-[var(--vd-muted-fg)]">{article.subtitle}</p>
            ) : null}
          </div>
          <p className="text-sm leading-relaxed text-[var(--vd-copy)]">{article.desc}</p>
        </div>

        {article.outcome ? (
          <div className="rounded-[calc(var(--vd-radius)+6px)] border border-[color-mix(in_oklch,var(--vd-border)_78%,transparent)] bg-background/78 p-4 transition-colors duration-300 group-hover:border-[color-mix(in_oklch,var(--vd-primary)_18%,var(--vd-border))] group-hover:bg-background/86">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--vd-muted-fg)]">Outcome</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--vd-copy)]">{article.outcome}</p>
          </div>
        ) : null}

        <WorkActions article={article} />
      </div>
    </article>
  )
}

export function Gallery29({
  className,
  items,
  title = 'Selected work',
  description = 'Real projects across charities, service businesses, and product platforms.',
}: Gallery29Props) {
  const [featured, ...secondary] = items

  if (!featured) return null

  return (
    <section
      id="portfolio"
      className={cn('relative overflow-hidden py-9', className)}
    >
      <div className="pointer-events-none absolute inset-x-0 top-22 -z-10 opacity-[0.42]">
        <Marquee className="py-0 [--duration:50s] [--gap:1.25rem]" repeat={2}>
          {items.map((article) => (
            <ProjectThumb key={`top-${article.slug}`} article={article} />
          ))}
        </Marquee>
        <Marquee className="mt-4 py-0 opacity-65 [--duration:58s] [--gap:1.25rem]" reverse repeat={2}>
          {items.map((article) => (
            <ProjectThumb key={`bottom-${article.slug}`} article={article} />
          ))}
        </Marquee>
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[var(--vd-bg)] to-transparent md:w-40" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[var(--vd-bg)] to-transparent md:w-40" />
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative isolate overflow-hidden rounded-[calc(var(--vd-radius)+18px)] border border-[color-mix(in_oklch,var(--vd-border)_68%,transparent)] bg-[color-mix(in_oklch,var(--vd-card)_86%,var(--vd-bg))] px-4 py-6 shadow-[0_40px_90px_-68px_color-mix(in_oklch,var(--vd-fg)_32%,transparent)] sm:px-6 sm:py-8 lg:px-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklch,var(--vd-primary)_10%,transparent),transparent_52%),radial-gradient(circle_at_bottom_right,color-mix(in_oklch,var(--vd-dino-blue)_10%,transparent),transparent_48%)]" />

          <div className="relative z-10 space-y-8">
            <div className="space-y-3 md:space-y-4">
              <h2 className="vd-section-heading text-2xl font-semibold tracking-tight md:text-[2.2rem]">
                {title}
              </h2>
              <p className="max-w-2xl text-[15px] leading-relaxed text-[var(--vd-copy)]">
                {description}
              </p>
            </div>

            <FeaturedProject article={featured} />

            {secondary.length ? (
              <div className="grid gap-6 lg:grid-cols-3">
                {secondary.map((article) => (
                  <SecondaryProject key={article.slug} article={article} />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
