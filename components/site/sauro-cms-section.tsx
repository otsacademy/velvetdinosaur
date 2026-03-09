type Feature = {
  title: string
  description: string
}

const features: Feature[] = [
  {
    title: "Drag and drop pages",
    description: "Create and structure pages quickly with flexible section controls.",
  },
  {
    title: "Simple editing",
    description: "Update text, images, and video without touching code.",
  },
  {
    title: "Visual theming",
    description: "Adjust colors, spacing, and typography to match your brand system.",
  },
  {
    title: "Cloud media library",
    description: "Organize uploads in cloud folders for cleaner day-to-day management.",
  },
  {
    title: "Built-in inbox and calendar",
    description: "Manage enquiries and bookings in one connected workflow.",
  },
  {
    title: "Secure and fast by default",
    description: "SSL, off-site backups, authentication, and performance-focused delivery.",
  },
]

export function SauroCmsSection() {
  return (
    <section id="cms" className="py-6 md:py-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">Content control</p>
          <h2 className="text-3xl font-semibold tracking-tight">Sauro CMS</h2>
          <p className="max-w-3xl text-muted-foreground">
            To give clients flexibility after launch, I built Sauro CMS: a founder-friendly editing system designed to
            stay simple while being tailored to each project. It keeps day-to-day content updates easy without forcing
            you into a generic platform model.
          </p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-[color-mix(in_srgb,var(--vd-bg)_45%,var(--vd-accent))] p-6 md:p-7">
          <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
            {features.map((feature) => (
              <div key={feature.title} className="border-b border-border/70 pb-3 last:border-b-0">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-foreground">{feature.title}:</span> {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
