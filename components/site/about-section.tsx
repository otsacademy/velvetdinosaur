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
    <article className="border-t border-border/70 pt-4">
      <div className="mb-3 flex items-center gap-3">
        <Icon className="h-4 w-4 text-primary" />
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      </div>
      <p className="max-w-xs text-sm font-medium leading-relaxed text-foreground/85">{value}</p>
    </article>
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

          <p className="text-foreground">
            I am Ian Wickens. I live in Minster Lovell and run Velvet Dinosaur, a founder-led studio building bespoke
            websites and apps for businesses, charities, and organisations that want something carefully made and
            properly theirs.
          </p>
          <p>
            Most of my professional career has been in the NHS, across medical equipment, clinical research, and
            governance. That background taught me how to work through complex problems, communicate clearly, and treat
            important work with care.
          </p>
          <p>
            Alongside that, I spent years designing and building websites in an independent, hands-on way. That
            included rebuilding my own charity website several times, creating conference websites, helping friends
            with their sites, and following other self-directed projects wherever they led.
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

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Highlight icon={Briefcase} label="Background" value="NHS work and years of independent web building" />
          <Highlight icon={Code2} label="Builds" value="Bespoke websites, apps, and tailored CMS tools" />
          <Highlight icon={Handshake} label="Approach" value="Founder-led, direct, and technically rigorous" />
        </div>
      </div>
    </section>
  )
}
