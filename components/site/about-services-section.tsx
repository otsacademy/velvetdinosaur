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
    <article className="border-t border-[color-mix(in_oklch,var(--vd-border)_78%,transparent)] pt-5">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[color-mix(in_oklch,var(--vd-dino-blue)_18%,transparent)] bg-[color-mix(in_oklch,var(--vd-dino-blue)_9%,transparent)] text-[var(--vd-dino-blue)]">
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
      </div>
      <h4 className="text-base font-semibold tracking-tight text-foreground">{title}</h4>
      <p className="mt-2 text-[0.95rem] leading-7 text-[var(--vd-copy)]">{description}</p>
    </article>
  )
}

export function AboutServicesSection() {
  return (
    <section id="about-services" className="py-10 md:py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div id="about" className="scroll-mt-28">
          <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(15rem,20rem)_minmax(0,1fr)]">
            <div>
              <h2 className="vd-as-title">About</h2>
            </div>

            <div className="hidden lg:block" aria-hidden="true" />

            <div className="space-y-5 lg:pr-2">
              {statCards.map((card) => (
                <StatCard key={card.eyebrow} {...card} />
              ))}
            </div>

            <article className="space-y-7">
              <div className="grid gap-5 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:items-start">
                <div className="relative h-28 w-28 overflow-hidden rounded-[1.75rem] border border-[color-mix(in_oklch,var(--vd-border)_82%,transparent)] bg-[color-mix(in_oklch,var(--vd-card)_94%,var(--vd-bg))] shadow-[0_12px_28px_-24px_color-mix(in_oklch,var(--vd-fg)_32%,transparent)] sm:h-30 sm:w-30">
                  <Image
                    src={r2PublicUrl("profile.webp")}
                    alt="Ian Wickens"
                    width={120}
                    height={120}
                    className="h-full w-full object-cover object-center"
                    priority
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-[1.55rem] font-semibold tracking-[-0.02em] text-foreground sm:text-[1.8rem]">
                    Ian Wickens
                  </h3>
                  <div className="space-y-5 text-[1.03rem] leading-8 text-[var(--vd-copy)]">
                    <p className="text-[1.1rem] leading-8 [color:color-mix(in_oklch,var(--vd-fg)_88%,var(--vd-bg))]">
                      Based in Oxfordshire, I build bespoke websites and apps for organisations seeking something different.
                    </p>
                    <p>
                      For most of my professional career, I have worked in the NHS across specialist medical devices, clinical research, and corporate governance. This unique medical background enables me to bring precision, clear communication, and a problem-solving mindset to complex digital projects; these values are consistently embedded in my work.
                    </p>
                    <p>
                      In addition, I have spent most of my adult life building sites independently: rebuilding charity platforms, coding conference websites, and understanding web technologies at a fundamental level. This hands-on experience fuels my passion and means my clients benefit from both technical depth and genuine curiosity.
                    </p>
                    <p className="border-l-2 border-[color-mix(in_oklch,var(--vd-primary)_42%,transparent)] pl-4 [color:color-mix(in_oklch,var(--vd-fg)_82%,var(--vd-bg))]">
                      Velvet Dinosaur was inspired by my 3-year-old daughter, who is obsessed with blue and dinosaurs.
                    </p>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}
