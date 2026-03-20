'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ExternalLink, MessageSquare, PencilRuler } from 'lucide-react'

import type { Article } from '@/lib/articles'
import { cn } from '@/lib/utils'
import { normalizeArticleAuthor } from '@/lib/work-presentation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type WorkArticlePageClientProps = {
  article: Article
  related: Article[]
}

export function WorkArticlePageClient({ article, related }: WorkArticlePageClientProps) {
  const normalizedAuthor = normalizeArticleAuthor(article.author)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const sectionRefs = useRef<Record<string, HTMLElement>>({})

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
    <section className="bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-5">
          <Link
            href="/work"
            className="mb-2 flex self-start items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Work
          </Link>
          <Badge variant="secondary">{article.tag}</Badge>
          <h1 className="text-center font-serif text-3xl font-bold text-foreground text-pretty lg:text-5xl">
            {article.title}
          </h1>
          <p className="text-center text-muted-foreground leading-relaxed lg:text-lg">{article.desc}</p>

          <div className="mt-4 flex items-center gap-4">
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
              <p className="text-sm font-medium text-foreground">{normalizedAuthor.name}</p>
              <p className="text-sm text-muted-foreground">{article.date}</p>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-5xl overflow-hidden rounded-xl border border-border p-2">
          <Image
            src={article.content.heroImg || article.img || '/placeholder.svg'}
            alt={article.title}
            width={1200}
            height={600}
            className="aspect-video w-full rounded-lg object-cover"
          />
        </div>

        <div className="relative mx-auto mt-16 grid max-w-6xl gap-10 lg:grid-cols-4">
          <div className="sticky top-24 hidden h-fit lg:block">
            <span className="text-base font-semibold text-foreground">Contents</span>
            <nav className="mt-4">
              <ul className="space-y-1">
                {article.content.sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className={cn(
                        'block border-l-2 py-1.5 pl-4 text-sm transition-colors duration-200',
                        activeSection === section.id
                          ? 'border-accent font-medium text-accent'
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
            <div className="mb-10">
              <p className="text-lg text-muted-foreground leading-relaxed">{article.content.intro}</p>
            </div>

            {article.content.sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                ref={(ref) => addSectionRef(section.id, ref)}
                className="mb-12"
              >
                <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">{section.title}</h2>
                {section.body.split('\n\n').map((paragraph, index) => (
                  <p key={`${section.id}-p-${index}`} className="mb-4 text-muted-foreground leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>

          <div className="sticky top-24 hidden h-fit rounded-xl border border-border bg-card p-6 lg:block">
            <h5 className="text-lg font-semibold text-card-foreground">Need something like this?</h5>
            <ul className="my-5 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                Bespoke websites and CMS tools
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                Direct founder-led delivery
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                Full ownership when the work is done
              </li>
            </ul>
            <div className="flex flex-col gap-2">
              <Link href="/#contact">
                <Button className="w-full gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Start a project
                </Button>
              </Link>
              {article.website ? (
                <Link href={article.website} target="_blank" rel="noreferrer">
                  <Button variant="outline" className="w-full gap-2 bg-transparent">
                    <ExternalLink className="h-4 w-4" />
                    View live site
                  </Button>
                </Link>
              ) : (
                <Link href="/#portfolio">
                  <Button variant="outline" className="w-full gap-2 bg-transparent">
                    <PencilRuler className="h-4 w-4" />
                    More selected work
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {related.length > 0 ? (
          <div className="mx-auto mt-20 max-w-6xl border-t border-border pt-12">
            <h3 className="mb-8 font-serif text-2xl font-bold text-foreground">Related Work</h3>
            <div className="grid gap-6 md:grid-cols-3">
              {related.map((entry) => (
                <Link key={entry.slug} href={`/work/${entry.slug}`} className="group">
                  <div className="overflow-hidden rounded-xl border border-border bg-card transition-all group-hover:border-accent/30 group-hover:shadow-lg">
                    <div className="relative aspect-video w-full overflow-hidden">
                      <Image
                        src={entry.img || '/placeholder.svg'}
                        alt={entry.title}
                        width={400}
                        height={250}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-5">
                      <Badge variant="secondary" className="mb-2 bg-secondary text-secondary-foreground">
                        {entry.tag}
                      </Badge>
                      <h4 className="text-base font-semibold text-card-foreground leading-snug transition-colors group-hover:text-accent">
                        {entry.title}
                      </h4>
                      <p className="mt-2 text-xs text-muted-foreground">{entry.date}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
