import type { ReactNode } from "react"

import { HomeFooter, HomeHeader, type NavKey } from "./home-chrome"
import { LETTER_FONT_VARIABLES } from "./letter-fonts"

/** The Letter token scope on its own: fonts and colours, no page box. */
export const LETTER_SCOPE = `${LETTER_FONT_VARIABLES} vd-letter`

/** Classes that put a whole page in the Letter design: scope, paper and ink. */
export const LETTER_SHELL = `${LETTER_SCOPE} relative min-h-dvh bg-background text-foreground`

// Shared page shell for the public pages: the Letter token scope (colours and
// type, see app/letter.css), the sticky header and the footer. The header is a
// direct child of the full-height shell so `sticky` has the whole page to
// travel along.
export function DesignShell({ active, children }: { active?: NavKey; children: ReactNode }) {
  return (
    <div className={LETTER_SHELL}>
      <HomeHeader active={active} />
      <main>{children}</main>
      <HomeFooter />
    </div>
  )
}
