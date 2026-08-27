import Image from "next/image"

import { r2PublicUrl } from "@/lib/public-assets"
import { cn } from "@/lib/utils"

const HEADSHOT_R2_PATH =
  "/uploads/site-media/velvetdinosaur/ian-profile-cdcd850774449b54.webp"

export function FounderAvatar({
  size,
  tone,
  shape = "circle",
  fillContainer = false,
  sizes,
  className,
}: {
  size: number
  tone: "dark" | "light"
  shape?: "circle" | "portrait"
  fillContainer?: boolean
  sizes?: string
  className?: string
}) {
  const height = shape === "portrait" ? Math.round(size * 1.25) : size
  const toneClasses =
    tone === "dark"
      ? "border-2 border-white/25 bg-white/10 text-white"
      : "border-[3px] border-background bg-primary/10 text-primary shadow-[var(--vd-shadow-md)]"

  return (
    <Image
      src={r2PublicUrl(HEADSHOT_R2_PATH)}
      alt="Ian Wickens"
      width={size}
      height={height}
      priority={shape === "portrait"}
      loading={shape === "portrait" ? "eager" : "lazy"}
      fetchPriority={shape === "portrait" ? "high" : "auto"}
      sizes={sizes}
      className={cn(
        "flex-none object-cover",
        fillContainer && "h-full w-full",
        shape === "portrait" ? "rounded-[1.25rem]" : "rounded-full",
        toneClasses,
        className,
      )}
      style={fillContainer ? undefined : { width: size, height }}
    />
  )
}
