import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ExternalLink } from 'lucide-react'

import type { Article } from '@/lib/articles'
import { listLatestPublishedWorkArticles } from '@/lib/work-articles.server'

function WorkCard({ article }: { article: Article }) {
  return (
    <article className="vd-hover-lift vd-work-card vd-surface-card group overflow-hidden border border-border bg-card/90">
      <div className="vd-work-media relative aspect-[16/10] w-full overflow-hidden bg-muted">
        <Image
          src={article.img || '/placeholder.svg'}
          alt={article.imageCaption || article.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
          className="object-cover object-top"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/95 to-transparent" />
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

      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-foreground transition-colors group-hover:text-primary">{article.title}</h3>
            {article.subtitle ? <p className="text-xs text-muted-foreground">{article.subtitle}</p> : null}
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{article.desc}</p>
        {article.outcome ? (
          <p className="mt-2 text-sm text-foreground/80">
            <span className="font-semibold text-foreground">Outcome:</span> {article.outcome}
          </p>
        ) : null}
        <div className="mt-4 flex items-center justify-between gap-3">
          <Link
            href={`/work/${article.slug}`}
            aria-label={`Read more about ${article.title}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-foreground transition-transform duration-200 group-hover:translate-x-0.5"
          >
            Read More
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
    <section id="portfolio" className="py-6 md:py-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-6 space-y-2">
          <h2 className="vd-section-heading text-2xl font-semibold">Selected work</h2>
          <p className="max-w-3xl text-foreground/80">
            Real projects across charities, service businesses, and product platforms.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {workItems.map((article) => (
            <WorkCard key={article.slug} article={article} />
          ))}
        </div>
      </div>
    </section>
  )
}
