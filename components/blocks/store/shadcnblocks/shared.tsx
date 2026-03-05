import type React from "react"

import { cn } from "@/lib/utils"

export function ShadcnblocksContainer({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-7xl [&_.container]:!mx-auto [&_.container]:!px-6",
        className,
      )}
    >
      {children}
    </div>
  )
}
