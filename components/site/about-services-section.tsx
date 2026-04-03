import type { ElementType } from "react"
import Image from "next/image"
import { Handshake, Star } from "lucide-react"

import { r2PublicUrl } from "@/lib/public-assets"

interface StatCardProps {
  icon: ElementType
  eyebrow: string
  title: string
  description: string
}

const statCards: StatCardProps[] = [
  {
    icon: Handshake,
    eyebrow: "Approach",
    title: "Direct from first call to launch",
    description:
      "You work with me throughout. No handoffs, no templates, and no platform lock-in at the end.",
  },
  {
    icon: Star,
    eyebrow: "Proof",
    title: "5.0 Google rating",
    description:
      "Independent reviews from clients who trusted Velvet Dinosaur with redesigns, migrations, and full builds.",
  },
]

function StatCard({ icon: Icon, eyebrow, title, description }: StatCardProps) {
  return (
    <article className="vd-as-stat-card rounded-[1.25rem] border border-[color-mix(in_oklch,var(--vd-border)_82%,transparent)] bg-[color-mix(in_oklch,var(--vd-card)_94%,var(--vd-bg))] p-5">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-[color-mix(in_oklch,var(--vd-dino-blue)_18%,transparent)] bg-[color-mix(in_oklch,var(--vd-dino-blue)_9%,transparent)] text-[var(--vd-dino-blue)]">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
      <h4 className="mt-2 text-base font-semibold tracking-tight text-foreground">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-[var(--vd-copy)]">{description}</p>
    </article>
  )
}

export function AboutServicesSection() {
  return (
    <section id="about-services" className="py-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="space-y-10">
          <div id="about" className="scroll-mt-28">
            <h2 className="vd-as-title mb-6">About</h2>
            <div className="grid gap-12 lg:grid-cols-3">
              <div className="space-y-4 lg:order-1 lg:col-span-1 lg:pt-14">
                {statCards.map((card) => (
                  <StatCard key={card.eyebrow} {...card} />
                ))}
              </div>

              <div className="space-y-6 lg:order-2 lg:col-span-2">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full">
                    <Image
                      src={r2PublicUrl("profile.webp")}
                      alt="Ian Wickens"
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                      priority
                    />
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight text-foreground">Ian Wickens</h3>
                </div>

                <div className="space-y-5 text-[var(--vd-copy)]">
                  <p>
                    Based in Oxfordshire, I build bespoke websites and apps for organisations seeking something different.
                  </p>
                  <p>
                    For most of my professional career, I have worked in the NHS across specialist medical devices, clinical research, and corporate governance. This unique medical background enables me to bring precision, clear communication, and a problem-solving mindset to complex digital projects; these values are consistently embedded in my work.
                  </p>
                  <p>
                    In addition, I have spent most of my adult life building sites independently: rebuilding charity platforms, coding conference websites, and understanding web technologies at a fundamental level. This hands-on experience fuels my passion and means my clients benefit from both technical depth and genuine curiosity.
                  </p>
                  <p>
                    Velvet Dinosaur was inspired by my 3-year-old daughter, who is obsessed with blue and dinosaurs.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
