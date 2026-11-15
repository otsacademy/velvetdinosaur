import Image from "next/image"

import { r2PublicUrl } from "@/lib/public-assets"
import { cn } from "@/lib/utils"

const HEADSHOT_SRC = r2PublicUrl(
  "/uploads/site-media/velvetdinosaur/ian-profile-cdcd850774449b54.webp",
)

/** Ian's headshot as a small round avatar, for the navy call-to-action panels. */
export function FounderAvatar({ size, className }: { size: number; className?: string }) {
  return (
    <Image
      src={HEADSHOT_SRC}
      alt="Ian Wickens"
      width={size}
      height={size}
      sizes={`${size}px`}
      className={cn(
        "flex-none rounded-full border-[3px] border-primary-foreground/60 object-cover object-[58%_30%]",
        className,
      )}
      style={{ width: size, height: size }}
    />
  )
}

/** The round "5.0 on Google" postmark that sits on the corner of the photograph. */
function GooglePostmark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 140 140"
      role="img"
      aria-label="Rated 5.0 on Google"
      className={cn("text-accent", className)}
    >
      <defs>
        <path id="vd-postmark-ring" d="M70,70 m-52,0 a52,52 0 1,1 104,0 a52,52 0 1,1 -104,0" />
      </defs>
      <circle cx="70" cy="70" r="67" className="fill-card" stroke="currentColor" strokeWidth="2" />
      <circle cx="70" cy="70" r="40" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <text fontSize="10.5" fontWeight="700" fill="currentColor" className="font-sans">
        <textPath href="#vd-postmark-ring" textLength="318" lengthAdjust="spacing">
          VELVET DINOSAUR · MINSTER LOVELL ·
        </textPath>
      </text>
      <text
        x="70"
        y="70"
        textAnchor="middle"
        fontSize="27"
        fontWeight="600"
        fill="currentColor"
        className="font-serif"
      >
        5.0
      </text>
      <text
        x="70"
        y="86"
        textAnchor="middle"
        fontSize="7.5"
        fontWeight="700"
        letterSpacing="1.4"
        fill="currentColor"
        className="font-sans"
      >
        ON GOOGLE
      </text>
    </svg>
  )
}

// Ian's photograph as a print tucked into the letter: white border, slight
// tilt, a handwritten caption. Use `postmark` on one photograph per page only,
// because the postmark's text path has a fixed id.
export function Polaroid({
  caption,
  postmark = false,
  preload = false,
  className,
}: {
  caption: string
  postmark?: boolean
  /** Set where the photograph is the first large thing on the page. */
  preload?: boolean
  className?: string
}) {
  return (
    <figure className={cn("relative m-0 w-[min(410px,100%)] rotate-[2.2deg]", className)}>
      <div className="rounded bg-card px-3.5 pb-4 pt-3.5 shadow-[var(--vd-shadow-paper)]">
        <Image
          src={HEADSHOT_SRC}
          alt="Ian Wickens, who runs Velvet Dinosaur"
          width={800}
          height={1000}
          sizes="(min-width: 480px) 382px, calc(100vw - 76px)"
          preload={preload}
          fetchPriority={preload ? "high" : undefined}
          className="block aspect-[4/5] h-auto w-full rounded-[2px] object-cover"
        />
        <figcaption className="pt-3 text-center font-hand text-[26px] font-semibold leading-[1.1] text-foreground sm:text-[28px]">
          {caption}
        </figcaption>
      </div>
      {postmark ? (
        <GooglePostmark className="absolute right-[-2px] top-[-34px] size-[112px] -rotate-[16deg] sm:right-[-30px] sm:size-[134px]" />
      ) : null}
    </figure>
  )
}
