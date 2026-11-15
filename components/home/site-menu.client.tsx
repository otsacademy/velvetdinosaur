"use client"

import Link from "next/link"
import { useState } from "react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { BTN_MD, HOME_BTN_PRIMARY, HOME_CONTAINER } from "./home-shared"

export type SiteMenuLink = { key: string; label: string; href: string; current?: boolean }

// The small-screen menu: a "Menu" button that drops the links below the
// sticky header. The panel is positioned against the header itself, so the
// page underneath never jumps.
export function SiteMenu({ links }: { links: SiteMenuLink[] }) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      onKeyDown={(event) => {
        if (event.key === "Escape") close()
      }}
      className="min-[1100px]:hidden"
    >
      <CollapsibleTrigger className="inline-flex min-h-[46px] cursor-pointer items-center justify-center rounded-full border-[1.5px] border-foreground bg-transparent px-[18px] text-base font-semibold text-foreground">
        {open ? "Close" : "Menu"}
      </CollapsibleTrigger>
      <CollapsibleContent className="absolute inset-x-0 top-full max-h-[calc(100dvh-75px)] overflow-y-auto border-y border-border bg-background shadow-[var(--vd-shadow-lift)]">
        <nav aria-label="Menu" className={`${HOME_CONTAINER} flex flex-col pb-6 pt-1.5 text-[19px] font-medium`}>
          {links.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              onClick={close}
              aria-current={link.current ? "page" : undefined}
              className="border-b border-border py-3.5 text-foreground hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/contact"
            onClick={close}
            className={`${HOME_BTN_PRIMARY} ${BTN_MD} mt-[18px] min-h-[52px] text-[17px]`}
          >
            Request your free preview
          </Link>
        </nav>
      </CollapsibleContent>
    </Collapsible>
  )
}
