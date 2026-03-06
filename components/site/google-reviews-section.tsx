import { BadgeCheck, Star } from "lucide-react"

type RatingBand = {
  label: string
  percentage: number
}

type Review = {
  name: string
  company: string
  quote: string
  date: string
  sourceUrl: string
  className: string
}

const ratingBands: RatingBand[] = [
  { label: "5 star", percentage: 100 },
  { label: "4 star", percentage: 0 },
  { label: "3 star", percentage: 0 },
  { label: "2 star", percentage: 0 },
  { label: "1 star", percentage: 0 },
]

const reviews: Review[] = [
  {
    name: "Faye Taylor",
    company: "Founder, The Brave",
    quote:
      "Phenomenal service and end result from a phenomenal chap. Ian went far beyond expectations and built a site that is user-friendly, strategic, and genuinely tailored to our audience.",
    date: "1 month ago",
    sourceUrl: "https://maps.app.goo.gl/vxcNWmsFxNUV9zvMA",
    className: "sm:col-span-2 lg:col-span-4",
  },
  {
    name: "Michal Apollo",
    company: "Co-Editor, Journal ASAP",
    quote:
      "We had a serious website problem and no one could fix it without a full rebuild. Ian from Velvet Dinosaur solved it in a few hours. Mission impossible handled.",
    date: "1 month ago",
    sourceUrl: "https://maps.app.goo.gl/EHiApj1drvvdPTsR8",
    className: "sm:col-span-1 lg:col-span-4",
  },
]

function ReviewCard({ name, company, quote, date, sourceUrl, className }: Review) {
  return (
    <article className={`vd-review-card vd-hover-lift-sm rounded-2xl border border-border bg-card p-6 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{name}</p>
          <p className="text-sm text-muted-foreground">{company}</p>
        </div>
        <span className="text-xs text-muted-foreground">{date}</span>
      </div>
      <div className="mb-4 flex items-center gap-1 text-foreground">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star key={index} className="h-4 w-4 fill-current" />
        ))}
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{quote}</p>
      <a
        className="mt-4 inline-flex text-sm font-medium text-foreground underline-offset-4 hover:underline"
        href={sourceUrl}
        target="_blank"
        rel="noreferrer"
      >
        View on Google Maps
      </a>
    </article>
  )
}

export function GoogleReviewsSection() {
  return (
    <section id="reviews" className="py-6 md:py-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-6 space-y-2">
          <h2 className="vd-section-heading text-2xl font-semibold">Google reviews</h2>
          <p className="max-w-3xl text-muted-foreground">
            Independent feedback from clients who trusted Velvet Dinosaur with
            redesigns, migrations, and full builds.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12">
          <article className="vd-review-card vd-hover-lift-sm rounded-2xl border border-border bg-card p-6 sm:col-span-2 lg:col-span-4">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-sm font-semibold">
                  G
                </div>
                <p className="text-sm font-medium">Google rating</p>
              </div>
              <BadgeCheck className="h-4 w-4 text-foreground" />
            </div>

            <div className="mb-6 flex items-end gap-2">
              <span className="text-4xl font-bold text-foreground">5.0</span>
              <span className="pb-1 text-sm text-muted-foreground">out of 5</span>
            </div>

            <div className="space-y-3">
              {ratingBands.map((band) => (
                <div key={band.label} className="grid grid-cols-[3.5rem_1fr] items-center gap-3">
                  <span className="text-xs text-muted-foreground">{band.label}</span>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-foreground"
                      style={{ width: `${band.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>

          {reviews.map((review) => (
            <ReviewCard key={review.name} {...review} />
          ))}
        </div>
      </div>
    </section>
  )
}
