import {
  ArrowLeftRight,
  Cloud,
  Globe,
  LifeBuoy,
  Lock,
  Mail,
  Palette,
  ShieldCheck,
} from "lucide-react"

type IncludedItem = {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const includedItems: IncludedItem[] = [
  {
    title: "Managed hosting",
    description: "Your site stays fast, monitored, and maintained without you managing servers.",
    icon: Cloud,
  },
  {
    title: "SSL security",
    description: "Your website runs on secure HTTPS so visitors see a trusted connection.",
    icon: Lock,
  },
  {
    title: "Backups",
    description: "Daily backups are stored off-site, with fast restore support if needed.",
    icon: ShieldCheck,
  },
  {
    title: "Email setup",
    description: "A working address like you@yourdomain.com with DNS and deliverability configured correctly.",
    icon: Mail,
  },
  {
    title: "Support portal",
    description: "One organised place to request changes, check status, and track decisions.",
    icon: LifeBuoy,
  },
  {
    title: "Domain migration",
    description: "We manage the technical switch so your website and email stay online.",
    icon: ArrowLeftRight,
  },
  {
    title: "Full ownership",
    description: "You own your domain, content, and website files from day one.",
    icon: Globe,
  },
  {
    title: "Custom design",
    description: "A tailored design that fits your goals, audience, and brand.",
    icon: Palette,
  },
]

export function WhatsIncludedSection() {
  return (
    <section id="included" className="py-6 md:py-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-6 space-y-2">
          <h2 className="vd-section-heading text-2xl font-semibold">What&apos;s included</h2>
          <p className="max-w-3xl text-foreground/80">
            The £2,500 package is designed to cover launch essentials without hidden extras.
          </p>
        </div>

        <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {includedItems.map((item) => {
            const Icon = item.icon

            return (
              <article key={item.title} className="border-t border-border/70 pt-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-foreground">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-foreground/75">{item.description}</p>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
