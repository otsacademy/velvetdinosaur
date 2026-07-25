import { existsSync } from "node:fs"
import path from "node:path"
import Image from "next/image"

import { cn } from "@/lib/utils"

const HEADSHOT_PUBLIC_PATH = "/ian-headshot.webp"

function hasHeadshot() {
  return existsSync(path.join(process.cwd(), "public", HEADSHOT_PUBLIC_PATH))
}

// Renders Ian's headshot when public/ian-headshot.webp exists; until that
// photo is provided, a brand-styled "IW" monogram stands in. Drop the photo
// in and rebuild — no code change needed.
export function FounderAvatar({
  size,
  tone,
  className,
}: {
  size: number
  tone: "dark" | "light"
  className?: string
}) {
  const toneClasses =
    tone === "dark"
      ? "border-2 border-white/25 bg-white/10 text-white"
      : "border-[3px] border-background bg-primary/10 text-primary shadow-[var(--vd-shadow-md)]"

  if (hasHeadshot()) {
    return (
      <Image
        src={HEADSHOT_PUBLIC_PATH}
        alt="Ian Wickens"
        width={size}
        height={size}
        className={cn("flex-none rounded-full object-cover", toneClasses, className)}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <span
      aria-label="Ian Wickens"
      role="img"
      className={cn(
        "flex flex-none select-none items-center justify-center rounded-full font-bold tracking-[0.02em]",
        toneClasses,
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
    >
      IW
    </span>
  )
}
