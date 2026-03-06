import Image from "next/image"
import { Briefcase, Handshake, Heart } from "lucide-react"
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

function Signature() {
  return (
    <div className="pt-2">
      <p
        className="text-2xl text-foreground/90"
        style={{ fontFamily: '"Brush Script MT", "Segoe Script", "Bradley Hand", cursive' }}
      >
        Ian Wickens
      </p>
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Founder, Velvet Dinosaur</p>
    </div>
  )
}

export function AboutSection() {
  return (
    <section id="about" className="py-6 md:py-8">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="vd-section-heading mb-6 text-2xl font-semibold">About me</h2>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="max-w-3xl space-y-5 text-muted-foreground">
            <p className="text-lg text-foreground">Hi, I&apos;m Ian Wickens, founder of Velvet Dinosaur.</p>
            <p>
              For most of my career, I worked in the NHS across medical equipment, clinical research, and governance,
              including Freedom of Information, risk, and health and safety. Throughout that time, I was always drawn
              to learning, problem-solving, and adapting to change.
            </p>
            <p>
              Outside work, I&apos;ve travelled extensively and founded a charity that has helped fund education for more
              than 50 children. Becoming a parent gave that sense of purpose even more focus. I now have two young
              children, and like many parents, I want to build something meaningful that creates a better future for
              them.
            </p>
            <p>
              When the opportunity came to leave the NHS, I decided to pursue what I had always been passionate about:
              building with technology. That decision became Velvet Dinosaur.
            </p>
            <p>
              The name comes from my daughter&apos;s love of animals, soft toys, and dinosaurs, especially her wish for a
              blue brachiosaurus. It felt imaginative, memorable, and a little different, which suits the way I work.
            </p>
            <Signature />
          </div>

          <div className="vd-about-photo-card vd-hover-lift-sm overflow-hidden rounded-2xl border border-border bg-card p-3">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl">
              <Image src={r2PublicUrl("profile.webp")} alt="Ian Wickens" fill className="vd-about-photo-image object-cover" />
            </div>
            <div className="mt-3">
              <p className="text-sm text-muted-foreground">Founder, Velvet Dinosaur</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Highlight icon={Briefcase} label="Experience" value="17+ years" />
          <Highlight icon={Heart} label="Charity work" value="50+ children supported" />
          <Highlight icon={Handshake} label="Approach" value="End-to-end, one point of contact" />
        </div>
      </div>
    </section>
  )
}
