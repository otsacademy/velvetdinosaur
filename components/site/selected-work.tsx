import { ArrowUpRight } from "lucide-react"

interface WorkItem {
  id: string
  title: string
  icon: React.ReactNode
  description: string
  gradient: string
}

const workItems: WorkItem[] = [
  {
    id: "asap",
    title: "Academics Stand Against Poverty",
    icon: <span className="text-2xl font-bold tracking-tight">ASAP</span>,
    description: "Full website redesign & bespoke CMS",
    gradient: "from-slate-700 to-slate-900",
  },
  {
    id: "the-brave",
    title: "The Brave",
    icon: <span className="text-4xl">✈️</span>,
    description: "Ethical tourism platform & travel system",
    gradient: "from-purple-300 to-purple-400",
  },
  {
    id: "rising-dust",
    title: "Rising Dust Adventures",
    icon: <span className="text-4xl">🏔️</span>,
    description: "Premium motorcycle expedition website",
    gradient: "from-amber-300 to-yellow-400",
  },
  {
    id: "scholardemia",
    title: "Scholardemia",
    icon: <span className="text-3xl font-serif font-bold">S</span>,
    description: "Academic networking & research platform",
    gradient: "from-slate-800 to-slate-950",
  },
]

function WorkCard({ title, icon, description, gradient }: WorkItem) {
  return (
    <a
      href="#portfolio"
      className="vd-hover-lift vd-work-card group block overflow-hidden rounded-2xl border border-border bg-card transition-all"
    >
      <div
        className={`vd-work-media flex h-44 items-center justify-center bg-gradient-to-br ${gradient} text-white`}
      >
        {icon}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </a>
  )
}

export function SelectedWork() {
  return (
    <section id="selected-work" className="py-8 md:py-10">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="vd-section-heading mb-6 text-2xl font-semibold">Selected work</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {workItems.map((item) => (
            <WorkCard key={item.id} {...item} />
          ))}
        </div>
      </div>
    </section>
  )
}
