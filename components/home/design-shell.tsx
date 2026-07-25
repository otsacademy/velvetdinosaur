import type { ReactNode } from "react"

import { HomeFooter, HomeHeader, type NavKey } from "./home-chrome"

// Shared page shell for the 2026 design pages (Home, Work, About, Contact):
// brand token scope, Archivo type, page background, sticky header, footer.
export function DesignShell({ active, children }: { active?: NavKey; children: ReactNode }) {
  return (
    <div className="vd-home relative min-h-dvh bg-muted text-foreground [font-family:var(--font-archivo,var(--vd-font-sans))]">
      <HomeHeader active={active} />
      <main>{children}</main>
      <HomeFooter />
    </div>
  )
}
