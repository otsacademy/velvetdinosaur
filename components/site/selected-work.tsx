import Image from "next/image"
import { ArrowUpRight, ExternalLink } from "lucide-react"

interface WorkItem {
  id: string
  title: string
  subtitle: string
  website: string
  image: string
  imageAlt: string
  description: string
  outcome: string
}

const workItems: WorkItem[] = [
  {
    id: "asap",
    title: "Academics Stand Against Poverty",
    subtitle: "International academic network fighting poverty",
    website: "https://academicsstand.org",
    image: "/portfolio/asap.png",
    imageAlt: "Screenshot of the Academics Stand Against Poverty website",
    description: "International network and journal platform redesign with bespoke CMS tooling.",
    outcome: "Improved publishing workflow and cleaner information architecture.",
  },
  {
    id: "the-brave",
    title: "The Brave",
    subtitle: "Values-led ethical tourism platform",
    website: "https://thebrave.online",
    image: "/portfolio/the-brave.png",
    imageAlt: "Screenshot of The Brave website homepage",
    description: "Values-led ethical travel platform with integrated advocacy and media storytelling.",
    outcome: "Stronger brand differentiation and clearer user pathways.",
  },
  {
    id: "rising-dust",
    title: "Rising Dust Adventures",
    subtitle: "Premium motorcycle expedition company",
    website: "https://risingdustadventures.com",
    image: "/portfolio/rising-dust.png",
    imageAlt: "Screenshot of Rising Dust Adventures expedition website",
    description: "Premium motorcycle expedition experience focused on route clarity and trust-building.",
    outcome: "Higher-quality visual storytelling and better route conversion flow.",
  },
  {
    id: "scholardemia",
    title: "Scholardemia",
    subtitle: "Academic social networking and research management platform",
    website: "https://scholardemia.com",
    image: "/portfolio/scholardemia.png",
    imageAlt: "Screenshot of Scholardemia sign-in experience",
    description: "Academic networking and publishing product with secure auth and scalable architecture.",
    outcome: "Unified product direction across community, collaboration, and publishing tools.",
  },
]

function WorkCard({ title, subtitle, website, image, imageAlt, description, outcome }: WorkItem) {
  return (
    <a
      href={website}
      target="_blank"
      rel="noreferrer"
      className="vd-hover-lift vd-work-card group block overflow-hidden rounded-2xl border border-border bg-card/90"
    >
      <div className="vd-work-media relative aspect-[16/10] w-full overflow-hidden bg-muted">
        <Image
          src={image}
          alt={imageAlt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
          className="object-cover object-top"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/95 to-transparent" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-primary/25 bg-background/85 px-2.5 py-1 text-[11px] font-medium text-foreground">
          Live project
          <ExternalLink className="h-3 w-3" />
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-foreground transition-colors group-hover:text-primary">{title}</h3>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <p className="mt-2 text-sm text-foreground/80">
          <span className="font-semibold text-foreground">Outcome:</span> {outcome}
        </p>
      </div>
    </a>
  )
}

export function SelectedWork() {
  return (
    <section id="portfolio" className="py-6 md:py-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-6 space-y-2">
          <h2 className="vd-section-heading text-2xl font-semibold">Selected work</h2>
          <p className="max-w-3xl text-foreground/80">
            Real projects across service businesses, non-profits, and product platforms.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {workItems.map((item) => (
            <WorkCard key={item.id} {...item} />
          ))}
        </div>
      </div>
    </section>
  )
}
