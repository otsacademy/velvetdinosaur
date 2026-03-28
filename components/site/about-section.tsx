import Image from "next/image"
import { Briefcase, Code2, Handshake, Star } from "lucide-react"
import { r2PublicUrl } from "@/lib/public-assets"
import { GoogleRatingCard, GoogleReviewCard, googleReviews } from "./google-reviews-section"

interface HighlightProps {
  icon: React.ElementType
  label: string
  value: string
}

function Highlight({ icon: Icon, label, value }: HighlightProps) {
  return (
    <article className="border-t border-border/70 pt-4">
      <div className="mb-3 flex items-center gap-3">
        <Icon className="h-4 w-4 text-primary" />
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      </div>
      <p className="max-w-xs text-sm font-medium leading-relaxed text-foreground/85">{value}</p>
    </article>
  )
}

const aboutReviews = googleReviews.map(({ name, company, quote, date, sourceUrl }) => ({
  name,
  company,
  quote,
  date,
  sourceUrl,
}))

export function AboutSection() {
  return (
    <section id="about" className="py-9">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="vd-section-heading mb-6 text-2xl font-semibold">About me</h2>

        <div className="space-y-5 text-muted-foreground">
          <div className="mb-2 flex items-start gap-5">
            <div
              className="vd-about-photo-card vd-hover-lift-sm w-[100px] min-w-[100px] overflow-hidden rounded-full border border-border/70 bg-card p-1"
              style={{ borderRadius: "9999px" }}
            >
              <div
                className="relative aspect-square w-full overflow-hidden rounded-full"
                style={{ borderRadius: "9999px" }}
              >
                <Image
                  src={r2PublicUrl("profile.webp")}
                  alt="Ian Wickens"
                  fill
                  sizes="100px"
                  priority
                  fetchPriority="high"
                  className="vd-about-photo-image rounded-full object-cover"
                />
              </div>
            </div>
            <p className="pt-1 text-foreground">
              I am Ian Wickens. I live in Minster Lovell and run Velvet Dinosaur, a founder-led studio building bespoke
              websites and apps for businesses, charities, and organisations that want something carefully made and
              properly theirs.
            </p>
          </div>

          <p>
            Most of my professional career has been in the NHS, across medical equipment, clinical research, and
            governance. That background taught me how to work through complex problems, communicate clearly, and treat
            important work with care.
          </p>
          <p>
            Alongside that, I spent years designing and building websites in an independent, hands-on way. That
            included rebuilding my own charity website several times, creating conference websites, helping friends with
            their sites, and following other self-directed projects wherever they led.
          </p>
          <p>
            Velvet Dinosaur grew out of that path as I started leaving the NHS. It is built on real project work,
            practical problem solving, and a preference for making things properly rather than dressing them up.
          </p>
          <p>
            You work directly with me from first conversation to launch. No templates. No page builders. No platform
            lock-in. Just well-built websites and apps, with full ownership when the work is done.
          </p>
        </div>

        <aside className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center gap-2 border-b border-border pb-1 md:col-span-2 lg:col-span-3">
            <Star className="h-4 w-4 fill-current text-foreground" />
            <span className="text-[0.9375rem] font-semibold text-foreground">Google Reviews</span>
            <span className="ml-auto text-[0.8125rem] text-muted-foreground">5.0 rating</span>
          </div>

          <GoogleRatingCard compact className="h-full" />

          {aboutReviews.map((review) => (
            <GoogleReviewCard key={review.name} {...review} compact className="h-full" />
          ))}
        </aside>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Highlight icon={Briefcase} label="Background" value="NHS work and years of independent web building" />
          <Highlight icon={Code2} label="Builds" value="Bespoke websites, apps, and tailored CMS tools" />
          <Highlight icon={Handshake} label="Approach" value="Founder-led, direct, and technically rigorous" />
        </div>
      </div>
    </section>
  )
}
