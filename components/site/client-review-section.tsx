import { Quote } from "lucide-react"

const featuredReview = {
  quote:
    "Phenomenal service and end result from a phenomenal chap. Ian went far beyond expectations and built a site that is user-friendly, strategic, and genuinely tailored to our audience.",
  author: "Faye Taylor",
  role: "Founder, The Brave",
  sourceUrl: "https://maps.app.goo.gl/vxcNWmsFxNUV9zvMA",
}

export function ClientReviewSection() {
  return (
    <section aria-labelledby="client-review-title" className="py-9">
      <div className="mx-auto max-w-6xl px-6">
        <article className="vd-surface-panel relative overflow-hidden border border-border bg-accent/35 px-6 py-12 text-center shadow-sm md:px-14 md:py-16">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-2 text-6xl leading-none text-foreground/10 md:left-8 md:top-4 md:text-8xl"
          >
            &ldquo;
          </span>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 right-4 text-6xl leading-none text-foreground/10 md:bottom-2 md:right-8 md:text-8xl"
          >
            &rdquo;
          </span>

          <div className="relative mx-auto max-w-4xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Quote className="h-3.5 w-3.5" />
              Client review
            </div>

            <h2 id="client-review-title" className="sr-only">
              Client review
            </h2>
            <blockquote className="text-balance text-2xl font-semibold italic leading-relaxed tracking-tight text-foreground md:text-3xl">
              &ldquo;{featuredReview.quote}&rdquo;
            </blockquote>
            <p className="mt-6 text-sm font-semibold text-foreground">
              {featuredReview.author}
            </p>
            <p className="text-sm text-muted-foreground">{featuredReview.role}</p>
            <a
              href={featuredReview.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              View original review
            </a>
          </div>
        </article>
      </div>
    </section>
  )
}
