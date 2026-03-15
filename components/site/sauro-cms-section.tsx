import { CalendarClock, FolderKanban, Images, Palette, PencilLine, ShieldCheck } from "lucide-react"

type Feature = {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const features: Feature[] = [
  {
    title: "Drag and drop pages",
    description: "Create and structure pages quickly with flexible section controls.",
    icon: FolderKanban,
  },
  {
    title: "Simple editing",
    description: "Update text, images, and video without touching code.",
    icon: PencilLine,
  },
  {
    title: "Visual theming",
    description: "Adjust colors, spacing, and typography to match your brand system.",
    icon: Palette,
  },
  {
    title: "Cloud media library",
    description: "Organize uploads in cloud folders for cleaner day-to-day management.",
    icon: Images,
  },
  {
    title: "Built-in inbox and calendar",
    description: "Manage enquiries and bookings in one connected workflow.",
    icon: CalendarClock,
  },
  {
    title: "Secure and fast by default",
    description: "SSL, off-site backups, authentication, and performance-focused delivery.",
    icon: ShieldCheck,
  },
]

export function SauroCmsSection() {
  return (
    <section id="cms" className="py-6 md:py-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-10 max-w-3xl space-y-4 text-center">
          <p className="vd-section-kicker">Content control</p>
          <h2 className="text-2xl font-semibold tracking-tight">Sauro CMS</h2>
          <p className="text-muted-foreground">
            To give clients flexibility after launch, I built Sauro CMS: a founder-friendly editing system designed to
            stay simple while being tailored to each project. It keeps day-to-day content updates easy without forcing
            you into a generic platform model.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="vd-hover-lift-sm vd-surface-card border border-border bg-background p-5 shadow-[0_18px_34px_-28px_color-mix(in_oklch,var(--vd-fg)_22%,transparent)]"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <feature.icon className="h-4 w-4" />
              </div>
              <h3 className="mb-2 font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
