import Image from "next/image"
import Link from "next/link"
import type { CSSProperties } from "react"

import { cn } from "@/lib/utils"
import { Dino3D } from "./dino-3d.client"
import {
  HOME_BTN_OUTLINE,
  HOME_BTN_PRIMARY,
  HOME_CONTAINER,
  HOME_MONO,
} from "./home-shared"

const HERO_BADGES = [
  "★ 5.0 on Google",
  "100/100 PageSpeed, every build",
  "One friendly human, start to finish",
] as const

const HERO_META = ["From £3,500, fixed before we start", "2–6 week delivery", "Oxfordshire, UK"] as const

function riseProps(animate: boolean, delayMs: number) {
  return {
    className: animate ? "vd-rise" : undefined,
    style: animate ? ({ "--vd-rise-delay": `${delayMs}ms` } as CSSProperties) : undefined,
  }
}

const PANEL_BACKGROUND: CSSProperties = {
  backgroundImage:
    "linear-gradient(color-mix(in oklch, var(--vd-primary) 5%, transparent) 1px, transparent 1px)," +
    "linear-gradient(90deg, color-mix(in oklch, var(--vd-primary) 5%, transparent) 1px, transparent 1px)," +
    "linear-gradient(180deg, color-mix(in srgb, var(--vd-primary) 7%, var(--vd-bg)), color-mix(in srgb, var(--vd-primary) 13%, var(--vd-bg)))",
  backgroundSize: "26px 26px, 26px 26px, 100% 100%",
}

function DinoPanel({ animate, interactive }: { animate: boolean; interactive: boolean }) {
  const rise = riseProps(animate, 670)
  const panelLabel = interactive
    ? "Meet the dinosaur — drag to spin him"
    : "Meet the dinosaur"

  return (
    <div
      className={cn(
        "relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-lg border border-primary/20 sm:min-h-[390px]",
        rise.className,
      )}
      style={{ ...PANEL_BACKGROUND, ...rise.style }}
    >
      {interactive ? (
        <Dino3D />
      ) : (
        <Image
          src="/dinosaur-512.webp"
          alt="The Velvet Dinosaur mascot"
          width={230}
          height={230}
          className="relative h-auto w-[230px]"
        />
      )}
      <div
        className={`${HOME_MONO} pointer-events-none absolute left-3.5 top-3.5 rounded-[3px] border border-primary/20 bg-background px-2 py-1 text-[10px] text-primary`}
      >
        {panelLabel}
      </div>
      <span
        aria-hidden
        className={`${HOME_MONO} pointer-events-none absolute right-3.5 top-2.5 text-xs text-primary/40`}
      >
        +
      </span>
      <span
        aria-hidden
        className={`${HOME_MONO} pointer-events-none absolute bottom-2.5 left-3.5 text-xs text-primary/40`}
      >
        +
      </span>
      <div
        className={`${HOME_MONO} pointer-events-none absolute bottom-3.5 right-3.5 rounded-[3px] border border-primary/20 bg-background px-2 py-1 text-[10px] text-muted-foreground`}
      >
        Named by my 3-year-old
      </div>
    </div>
  )
}

export function HomeHero({ animate, interactive3d }: { animate: boolean; interactive3d: boolean }) {
  return (
    <section id="home" className="border-b border-border bg-background">
      <div
        className={`${HOME_CONTAINER} grid gap-12 pb-14 pt-14 lg:grid-cols-[minmax(0,1fr)_340px] lg:pb-16 lg:pt-[72px]`}
      >
        <div className="flex flex-col gap-6">
          <div {...riseProps(animate, 120)}>
            <div className="flex flex-wrap gap-2">
              {HERO_BADGES.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full bg-primary/10 px-3.5 py-1.5 text-[12.5px] font-semibold text-primary"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
          <h1
            className={cn(
              "m-0 text-balance text-[40px] font-extrabold leading-[1.05] tracking-[-0.035em] text-foreground sm:text-5xl lg:text-[54px] lg:leading-[1.04]",
              animate && "vd-rise-slide",
            )}
            style={animate ? ({ "--vd-rise-delay": "230ms" } as CSSProperties) : undefined}
          >
            A fast, beautiful website that feels{" "}
            <span className="relative isolate inline-block">
              properly yours
              <span
                aria-hidden
                className={cn(
                  "vd-sweep absolute bottom-[5px] left-0.5 z-[-1] h-2.5 bg-primary/20",
                  !animate && "!animate-none",
                )}
              />
            </span>
            .
          </h1>
          <p
            {...riseProps(animate, 340)}
            className="m-0 max-w-[480px] text-pretty text-[16.5px] leading-relaxed text-muted-foreground"
          >
            No jargon, no agency runaround — you work directly with me, Ian. I design and build
            bespoke websites and apps for charities, healthcare, and small businesses: quick to
            load, easy to update, and made to turn visitors into clients.
          </p>
          <div {...riseProps(animate, 450)}>
            <div className="flex flex-wrap gap-3">
              <Link href="/contact" className={`${HOME_BTN_PRIMARY} px-7 py-3.5 text-sm`}>
                Start your project
              </Link>
              <Link href="/work" className={`${HOME_BTN_OUTLINE} px-7 py-3.5 text-sm`}>
                See the work
              </Link>
            </div>
          </div>
          <div
            {...riseProps(animate, 560)}
            className={`${HOME_MONO} flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-1 text-xs text-muted-foreground`}
          >
            {HERO_META.map((item, index) => (
              <span key={item} className="flex items-center gap-x-2.5">
                {index > 0 ? <span aria-hidden>·</span> : null}
                {item}
              </span>
            ))}
          </div>
        </div>
        <DinoPanel animate={animate} interactive={interactive3d} />
      </div>
    </section>
  )
}
