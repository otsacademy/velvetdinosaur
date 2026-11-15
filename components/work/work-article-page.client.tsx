'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ExternalLink } from 'lucide-react'

import {
  BTN_MD,
  HOME_BTN_OUTLINE,
  HOME_BTN_PRIMARY,
  HOME_CARD,
  HOME_CARD_HOVER,
  HOME_CONTAINER,
  HOME_KICKER,
  LETTER_LEAD,
  LETTER_LINK,
} from '@/components/home/home-shared'
import type { Article } from '@/lib/articles'
import { cn } from '@/lib/utils'
import { normalizeArticleAuthor } from '@/lib/work-presentation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

type WorkArticlePageClientProps = {
  article: Article
  related: Article[]
}

const SECTION_HEADING = 'm-0 mb-4 text-[27px] leading-[1.15] tracking-[-0.01em] sm:text-[29px]'

// A case study, set in the Letter design: title block, framed snapshot, then
// the story with a contents rail on wide screens.
export function WorkArticlePageClient({ article, related }: WorkArticlePageClientProps) {
  const normalizedAuthor = normalizeArticleAuthor(article.author)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const sectionRefs = useRef<Record<string, HTMLElement>>({})
  const heroImage = article.heroImage
  const heroImageFit = heroImage?.fit ?? 'cover'
  const heroImageWidth = heroImage?.width ?? 1200
  const heroImageHeight = heroImage?.height ?? 600
  const heroImageAlt = heroImage?.alt ?? article.imageCaption ?? article.title

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        }
      },
      {
        root: null,
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0,
      },
    )

    for (const element of Object.values(sectionRefs.current)) {
      observer.observe(element)
    }

    return () => observer.disconnect()
  }, [article.slug])

  const addSectionRef = (id: string, ref: HTMLElement | null) => {
    if (ref) sectionRefs.current[id] = ref
  }

  return (
    <article className={`${HOME_CONTAINER} pt-10 sm:pt-14`}>
      <div className="mx-auto flex max-w-[900px] flex-col items-center gap-5">
        <Link
          href="/work"
          className="mb-2 flex items-center gap-2 self-start text-base font-semibold text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Back to Work
        </Link>
        <p className={`${HOME_KICKER} m-0 text-accent`}>{article.tag}</p>
        <h1 className="m-0 text-balance text-center text-[clamp(2.25rem,4.4vw,3.75rem)] leading-[1.05] tracking-[-0.022em]">
          {article.title}
        </h1>
        <p className={`${LETTER_LEAD} text-center`}>{article.desc}</p>

        <div className="mt-2 flex items-center gap-4">
          <Avatar className="size-12 border border-border">
            <AvatarImage src={normalizedAuthor.img} className="object-cover" />
            <AvatarFallback className="bg-primary text-sm text-primary-foreground">
              {normalizedAuthor.name
                .split(' ')
                .map((part) => part[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="m-0 text-base font-semibold text-foreground">{normalizedAuthor.name}</p>
            <p className="m-0 text-[15px] text-muted-foreground">{article.date}</p>
          </div>
        </div>
      </div>

      <div className={`${HOME_CARD} mx-auto mt-12 max-w-[1040px] overflow-hidden p-3.5`}>
        <Image
          src={article.content.heroImg || article.img || '/placeholder.svg'}
          alt={heroImageAlt}
          width={heroImageWidth}
          height={heroImageHeight}
          className={
            heroImageFit === 'contain'
              ? 'h-auto w-full rounded border border-border'
              : 'aspect-video w-full rounded border border-border object-cover'
          }
          sizes="(min-width: 1120px) 1010px, calc(100vw - 78px)"
        />
        {article.imageCaption ? (
          <p className="m-0 px-2 pb-1 pt-3 text-[15px] text-muted-foreground">
            {article.imageCaption}
          </p>
        ) : null}
      </div>

      <div className="relative mx-auto mt-16 grid max-w-[1176px] gap-10 lg:grid-cols-4">
        <div className="sticky top-28 hidden h-fit lg:block">
          <span className={`${HOME_KICKER} text-accent`}>Contents</span>
          <nav aria-label="Contents" className="mt-4">
            <ul className="m-0 list-none space-y-1 p-0">
              {article.content.sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className={cn(
                      'block border-l-2 py-1.5 pl-4 text-base transition-colors duration-200',
                      activeSection === section.id
                        ? 'border-accent font-semibold text-accent'
                        : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                    )}
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="lg:col-span-2">
          <p className={`${LETTER_LEAD} mb-10`}>{article.content.intro}</p>

          {article.content.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              ref={(ref) => addSectionRef(section.id, ref)}
              className="mb-12 scroll-mt-28"
            >
              <h2 className={SECTION_HEADING}>{section.title}</h2>
              {section.body.split('\n\n').map((paragraph, index) => (
                <p key={`${section.id}-p-${index}`} className="m-0 mb-4 text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}

          {article.pageSpeedSnapshot ? (
            <section id="pagespeed-proof" className="mb-12 scroll-mt-28">
              <h2 className={SECTION_HEADING}>Live Performance Proof</h2>
              <p className="m-0 mb-6 text-muted-foreground">
                {article.pageSpeedSnapshot.description}
              </p>

              <div className={`${HOME_CARD} mb-6 overflow-hidden`}>
                <div className="relative h-[140px] w-full overflow-hidden">
                  <Image
                    src={article.pageSpeedSnapshot.image.src}
                    alt="Lighthouse score circles showing Performance 100, Accessibility 100, Best Practices 96, SEO 100"
                    width={article.pageSpeedSnapshot.image.width}
                    height={article.pageSpeedSnapshot.image.height}
                    className="absolute left-1/2 h-auto w-[1040px] max-w-none -translate-x-1/2"
                    style={{ top: '-525px' }}
                    sizes="1040px"
                  />
                </div>
              </div>

              <div className="space-y-4 text-base text-muted-foreground">
                <div>
                  <span className="font-semibold text-foreground">
                    Performance ({article.pageSpeedSnapshot.scores.performance})
                  </span>
                  <span className="mx-2">—</span>
                  Page loads in under a second with optimised assets, efficient caching, and
                  minimal render-blocking resources.
                </div>
                <div>
                  <span className="font-semibold text-foreground">
                    Accessibility ({article.pageSpeedSnapshot.scores.accessibility})
                  </span>
                  <span className="mx-2">—</span>
                  Semantic HTML, proper heading hierarchy, sufficient colour contrast, and
                  keyboard navigation throughout.
                </div>
                <div>
                  <span className="font-semibold text-foreground">
                    Best Practices ({article.pageSpeedSnapshot.scores.bestPractices})
                  </span>
                  <span className="mx-2">—</span>
                  HTTPS everywhere, no deprecated APIs, secure external links, and modern image
                  formats.
                </div>
                <div>
                  <span className="font-semibold text-foreground">
                    SEO ({article.pageSpeedSnapshot.scores.seo})
                  </span>
                  <span className="mx-2">—</span>
                  Crawlable content, valid meta tags, descriptive link text, and mobile-friendly
                  viewport.
                </div>
              </div>

              <p className="m-0 mt-6 text-[15px] text-muted-foreground">
                {article.pageSpeedSnapshot.capturedAt} ·{' '}
                <Link
                  href={article.pageSpeedSnapshot.reportUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={LETTER_LINK}
                >
                  View full report
                </Link>
              </p>
            </section>
          ) : null}
        </div>

        <aside className={`${HOME_CARD} sticky top-28 hidden h-fit p-6 lg:block`}>
          <h2 className="m-0 text-[24px] leading-[1.15]">Need something like this?</h2>
          <ul className="my-5 list-none space-y-3 p-0 text-base text-muted-foreground">
            {[
              'Managed websites with CMS tools',
              'Direct founder-led delivery',
              'Full ownership when the work is done',
            ].map((point) => (
              <li key={point} className="flex items-start gap-2.5">
                <span aria-hidden className="mt-2.5 block size-1.5 flex-none rounded-full bg-accent" />
                {point}
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2.5">
            <Link href="/contact" className={`${HOME_BTN_PRIMARY} ${BTN_MD} px-3 text-[15px]`}>
              Request your free preview
            </Link>
            {article.website ? (
              <Link
                href={article.website}
                target="_blank"
                rel="noreferrer"
                className={`${HOME_BTN_OUTLINE} ${BTN_MD} px-3 text-[15px]`}
              >
                <ExternalLink aria-hidden className="size-4" />
                View live site
              </Link>
            ) : (
              <Link href="/work" className={`${HOME_BTN_OUTLINE} ${BTN_MD} px-3 text-[15px]`}>
                More selected work
              </Link>
            )}
          </div>
        </aside>
      </div>

      {related.length > 0 ? (
        <div className="mx-auto mt-20 max-w-[1176px] border-t border-border pt-12">
          <h2 className="m-0 mb-8 text-[29px] leading-[1.15] tracking-[-0.01em]">Related Work</h2>
          <div className="grid gap-[22px] md:grid-cols-3">
            {related.map((entry) => (
              <Link
                key={entry.slug}
                href={`/work/${entry.slug}`}
                className={cn(HOME_CARD, HOME_CARD_HOVER, 'block p-3.5 pb-5 hover:text-foreground')}
              >
                <Image
                  src={entry.img || '/placeholder.svg'}
                  alt={entry.title}
                  width={400}
                  height={250}
                  className="aspect-video h-auto w-full rounded border border-border object-cover"
                />
                <div className="px-2 pt-4">
                  <p className={`${HOME_KICKER} m-0 text-accent`}>{entry.tag}</p>
                  <h3 className="m-0 mt-1.5 text-[22px] leading-[1.2]">{entry.title}</h3>
                  <p className="m-0 mt-2 text-[15px] text-muted-foreground">{entry.date}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  )
}
