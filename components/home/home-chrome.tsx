import Image from "next/image"
import Link from "next/link"

import { PHONE_DISPLAY, PHONE_HREF, WHATSAPP_HREF } from "@/lib/contact-details"
import { TRADING_NAME_STATEMENT } from "@/lib/legal-identity"
import { cn } from "@/lib/utils"
import { BTN_MD, HOME_BTN_PRIMARY, HOME_CONTAINER } from "./home-shared"
import { SiteMenu } from "./site-menu.client"

export type NavKey = "work" | "about" | "contact"

// The header follows the parts of the letter on the home page, plus the two
// pages that stand on their own.
const NAV_LINKS: Array<{ key: string; label: string; href: string; page?: NavKey }> = [
  { key: "how", label: "How it works", href: "/#how-it-works" },
  { key: "get", label: "What you get", href: "/#what-you-get" },
  { key: "work", label: "Work", href: "/work", page: "work" },
  { key: "reviews", label: "Reviews", href: "/#reviews" },
  { key: "about", label: "About", href: "/about", page: "about" },
  { key: "questions", label: "Questions", href: "/#questions" },
]

const FOOTER_LETTER_LINKS = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "What you get", href: "/#what-you-get" },
  { label: "Reviews", href: "/#reviews" },
  { label: "Questions", href: "/#questions" },
] as const

const FOOTER_PAGE_LINKS = [
  { label: "Work", href: "/work" },
  { label: "About Ian", href: "/about" },
  { label: "Web design in Witney", href: "/web-design-witney" },
  { label: "Web design in Oxfordshire", href: "/web-design-oxfordshire" },
] as const

const FOOTER_LINK =
  "text-[var(--vd-surface-strong-fg)]/90 transition-colors duration-200 hover:text-[var(--vd-surface-strong-fg)] hover:underline hover:underline-offset-4"

export function HomeHeader({ active }: { active?: NavKey }) {
  const links = NAV_LINKS.map((link) => ({
    key: link.key,
    label: link.label,
    href: link.href,
    current: Boolean(link.page && link.page === active),
  }))

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <div className={`${HOME_CONTAINER} flex h-[74px] items-center justify-between gap-3 sm:gap-5`}>
        <Link
          href="/"
          aria-label="Velvet Dinosaur, home"
          className="flex items-center gap-2 text-foreground hover:text-foreground min-[380px]:gap-2.5"
        >
          <Image
            src="/brand/mark-navy.webp"
            alt=""
            width={36}
            height={33}
            className="h-[33px] w-9"
          />
          <span className="whitespace-nowrap font-serif text-[19px] font-semibold leading-none tracking-[-0.01em] min-[380px]:text-[22px] sm:text-[23px]">
            Velvet Dinosaur
          </span>
        </Link>
        <nav
          aria-label="Main"
          className="hidden items-center gap-7 text-base font-medium min-[1100px]:flex"
        >
          {links.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              aria-current={link.current ? "page" : undefined}
              className={cn(
                "border-b-2 py-1.5 transition-colors duration-200 hover:border-highlight hover:text-primary",
                link.current
                  ? "border-highlight text-primary"
                  : "border-transparent text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2.5">
          <Link
            href="/contact"
            className={`${HOME_BTN_PRIMARY} ${BTN_MD} whitespace-nowrap max-[559px]:hidden`}
          >
            Request your free preview
          </Link>
          <SiteMenu links={links} />
        </div>
      </div>
    </header>
  )
}

export function HomeFooter() {
  return (
    <footer className="bg-[var(--vd-surface-strong)] text-[var(--vd-surface-strong-fg)]">
      <div className={`${HOME_CONTAINER} pb-10 pt-16`}>
        <div className="flex flex-wrap justify-between gap-x-14 gap-y-10">
          <div className="max-w-[420px] flex-[1_1_320px]">
            <div className="flex items-center gap-2.5">
              <Image
                src="/brand/mark-cream.webp"
                alt=""
                width={38}
                height={35}
                className="h-[35px] w-[38px]"
              />
              <span className="font-serif text-[25px] font-semibold leading-none tracking-[-0.01em]">
                Velvet Dinosaur
              </span>
            </div>
            <p className="m-0 mt-4 text-lg text-[var(--vd-surface-strong-fg)]/90">
              Websites for small businesses and organisations, built before you pay and looked
              after by one person. Minster Lovell, near Witney, Oxfordshire.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-14 gap-y-10 text-[17px]">
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {FOOTER_LETTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={FOOTER_LINK}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {FOOTER_PAGE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={FOOTER_LINK}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {/* Direct lines to Ian, on every page rather than one contact card. */}
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[17px]">
            <li>
              <a href={PHONE_HREF} className={FOOTER_LINK}>
                {PHONE_DISPLAY}
              </a>
            </li>
            <li>
              <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className={FOOTER_LINK}>
                WhatsApp
              </a>
            </li>
            <li>
              <a href="mailto:hello@velvetdinosaur.com" className={FOOTER_LINK}>
                hello@velvetdinosaur.com
              </a>
            </li>
            <li>
              <Link href="/contact" className={FOOTER_LINK}>
                Request your free preview
              </Link>
            </li>
          </ul>
        </div>
        <div className="mt-12 flex flex-wrap justify-between gap-x-10 gap-y-3.5 border-t border-[var(--vd-surface-strong-fg)]/20 pt-6 text-sm leading-[1.55] text-[var(--vd-surface-strong-fg)]/85">
          {TRADING_NAME_STATEMENT ? (
            <p className="m-0 max-w-[760px] flex-[1_1_520px]">{TRADING_NAME_STATEMENT}</p>
          ) : null}
          <p className="m-0 flex flex-wrap gap-x-[22px] gap-y-1">
            <span>© 2026 Velvet Dinosaur</span>
            <Link href="/privacy" className={FOOTER_LINK}>
              Privacy
            </Link>
            <Link href="/terms" className={FOOTER_LINK}>
              Terms
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
