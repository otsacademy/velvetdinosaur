import Image from "next/image"
import { Briefcase, Code2, Handshake } from "lucide-react"
import { r2PublicUrl } from "@/lib/public-assets"

interface HighlightProps {
  icon: React.ElementType
  label: string
  value: string
}

function Highlight({ icon: Icon, label, value }: HighlightProps) {
  return (
    <div className="vd-hover-lift-sm vd-icon-card rounded-xl border border-border bg-card p-4">
      <div className="vd-icon-badge mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="vd-icon-accent h-5 w-5 text-primary" />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground">{value}</p>
    </div>
  )
}

export function AboutSection() {
  return (
    <section id="about" className="py-6 md:py-8">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="mb-6 text-2xl font-semibold">About me</h2>

        <div className="max-w-5xl space-y-5 text-muted-foreground">
          <div
            className="vd-about-photo-card vd-hover-lift-sm float-left mb-3 mr-5 w-[168px] overflow-hidden rounded-full border border-border/70 bg-card p-1 sm:w-[180px] md:w-[192px]"
            style={{ borderRadius: "9999px" }}
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-full" style={{ borderRadius: "9999px" }}>
              <Image
                src={r2PublicUrl("profile.webp")}
                alt="Ian Wickens"
                fill
                className="vd-about-photo-image rounded-full object-cover"
              />
            </div>
          </div>

          <p className="text-lg text-foreground">
            I&apos;m Ian Wickens, founder of Velvet Dinosaur. I design and build bespoke websites, apps, and digital
            platforms for organizations that want something more thoughtful than an off-the-shelf solution.
          </p>
          <p>
            Before starting Velvet Dinosaur, I spent much of my career in the NHS across medical equipment, clinical
            research, and governance. That background taught me how to solve complex problems, communicate clearly, and
            adapt quickly, skills I now bring into every digital project.
          </p>
          <p>
            I&apos;ve also travelled extensively and founded a charity that has helped fund education for more than 50
            children. Becoming a parent sharpened my focus even further. I wanted to build something meaningful,
            creative, and lasting.
          </p>
          <p>
            That decision led to Velvet Dinosaur, a founder-led studio where every project is built with care,
            collaboration, and attention to detail. The name comes from my daughter&apos;s love of dinosaurs, a reminder
            to build with imagination as well as purpose.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Highlight icon={Briefcase} label="Experience" value="17+ years solving complex problems" />
          <Highlight icon={Code2} label="Builds" value="Bespoke websites, apps, and CMS platforms" />
          <Highlight icon={Handshake} label="Approach" value="Founder-led, direct collaboration" />
        </div>
      </div>
    </section>
  )
}
