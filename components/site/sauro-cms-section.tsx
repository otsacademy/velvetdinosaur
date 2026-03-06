import { LayoutPanelLeft, PenLine, Palette, Upload, Lock, Zap } from "lucide-react"

interface Feature {
  icon: React.ElementType
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: LayoutPanelLeft,
    title: "Drag & drop pages",
    description: "Create new pages using flexible drag-and-drop sections",
  },
  {
    icon: PenLine,
    title: "Easy editing",
    description: "Edit text, images, and video with ease",
  },
  {
    icon: Palette,
    title: "Visual theming",
    description: "Update your site's visual theme to match your brand",
  },
  {
    icon: Upload,
    title: "Cloud media",
    description: "Organise media in cloud-based folders",
  },
  {
    icon: Lock,
    title: "Secure by default",
    description: "SSL, daily off-site backups, and secure authentication",
  },
  {
    icon: Zap,
    title: "Built for speed",
    description: "Infrastructure built for speed, reliability, and security",
  },
]

function FeatureCard({ icon: Icon, title, description }: Feature) {
  return (
    <div className="vd-hover-lift-sm vd-icon-card rounded-2xl border border-border bg-card p-6">
      <div className="vd-icon-badge mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="vd-icon-accent h-6 w-6 text-primary" />
      </div>
      <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

export function SauroCmsSection() {
  return (
    <section className="py-6 md:py-8">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="vd-section-heading mb-4 text-2xl font-semibold">Sauro CMS</h2>
        <p className="mb-10 max-w-3xl text-muted-foreground">
          To give clients flexibility after launch, I&apos;ve developed my own content management
          system: Sauro CMS. It is designed to make content editing simple while staying
          tailored to each project. Unlike off-the-shelf CMS platforms, it is customised to
          your needs, so no two versions are exactly the same.
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  )
}
