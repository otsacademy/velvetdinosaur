import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

import { DesignShell } from "@/components/home/design-shell"
import {
  BTN_LG,
  HOME_BTN_OUTLINE,
  HOME_BTN_PRIMARY,
  HOME_CONTAINER,
  HOME_KICKER,
  LETTER_LEAD,
  LETTER_LINK,
  LETTER_PAGE_H1,
} from "@/components/home/home-shared"

// Page frame for the pages that emailed links open (confirm a subscription or
// an event registration, unsubscribe), in the Letter design of the public pages:
// the site's own header and footer, the kicker, headline and lead of the inner
// pages, and the site's buttons.

export const EMAIL_LINK_TEXT = {
  heading: `${LETTER_PAGE_H1} outline-none`,
  lead: `${LETTER_LEAD} mt-[22px] max-w-[640px]`,
  help: "m-0 mt-8 text-[15px] text-muted-foreground",
  link: LETTER_LINK,
}

export const EMAIL_LINK_BUTTON = {
  primary: `${HOME_BTN_PRIMARY} ${BTN_LG} cursor-pointer border-0 disabled:cursor-default disabled:opacity-60`,
  outline: `${HOME_BTN_OUTLINE} ${BTN_LG} cursor-pointer disabled:cursor-default disabled:opacity-60`,
}

/** The round mark above a result: a tick on navy for done, the pen colour for a problem. */
export function ResultMark({ icon: Icon, tone }: { icon: LucideIcon; tone: "done" | "problem" }) {
  return (
    <span
      className={
        tone === "done"
          ? "mb-7 flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground"
          : "mb-7 flex size-16 items-center justify-center rounded-full border-[1.5px] border-accent text-accent"
      }
    >
      <Icon aria-hidden width={30} height={30} strokeWidth={2.2} />
    </span>
  )
}

export function EmailLinkPage({ context, children }: { context: string; children: ReactNode }) {
  return (
    <DesignShell>
      <section className={`${HOME_CONTAINER} pb-20 pt-14 sm:pb-[110px] sm:pt-[76px]`}>
        <div className="max-w-[720px]">
          <p className={`${HOME_KICKER} m-0 mb-3 text-accent`}>{context}</p>
          {children}
        </div>
      </section>
    </DesignShell>
  )
}
