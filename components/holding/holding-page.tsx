import { Hero1 } from "@/components/hero1"
import { holdingHeroCopy } from "@/lib/site-copy"

import { PixelImage } from "./pixel-image.client"

export function HoldingPage() {
  return (
    <div className="holding-bg relative min-h-dvh overflow-hidden px-6 py-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.22] [background-image:radial-gradient(circle_at_1px_1px,color-mix(in_oklch,oklch(var(--vd-foreground))_18%,transparent)_1px,transparent_0)] [background-size:22px_22px]"
        aria-hidden="true"
      />

      <main className="relative mx-auto w-full max-w-6xl">
        <Hero1
          className="animate-vd-fade-up py-12 md:py-16 lg:py-20"
          badge={holdingHeroCopy.badge}
          heading={holdingHeroCopy.heading}
          description={holdingHeroCopy.description}
          buttons={{
            primary: { text: "Email us", url: "mailto:hello@velvetdinosaur.com" },
          }}
          imageSlot={
            <div className="animate-vd-float [animation-delay:220ms]">
              <div className="vd-dino-card mx-auto w-fit rounded-[calc(var(--vd-radius)+10px)] border border-transparent bg-transparent p-3 shadow-none backdrop-blur-none hover:border-border/60 hover:bg-background/45 hover:backdrop-blur">
                <PixelImage
                  src="/dinosaur.webp"
                  alt="Velvet Dinosaur mascot assembling from grayscale to full color"
                  grid="8x8"
                  grayscaleAnimation
                  colorRevealDelay={1500}
                  className="rounded-xl"
                  sizeClassName="h-[min(26rem,84vw)] w-[min(26rem,84vw)] sm:h-[min(30rem,70vw)] sm:w-[min(30rem,70vw)] lg:h-[min(34rem,42vw)] lg:w-[min(34rem,42vw)]"
                />
              </div>
            </div>
          }
        />

        <footer className="mt-12 text-xs text-muted-foreground">
          © 2026 Velvet Dinosaur.{" "}
          <a className="underline underline-offset-4 hover:text-foreground" href="mailto:hello@velvetdinosaur.com">
            hello@velvetdinosaur.com
          </a>
        </footer>
      </main>
    </div>
  )
}
