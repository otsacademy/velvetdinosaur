import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { HOME_BTN_PRIMARY, HOME_CONTAINER } from "./home-shared"

export type NavKey = "work" | "about" | "contact"

const NAV_LINKS: Array<{ key: NavKey; label: string; href: string }> = [
  { key: "work", label: "Work", href: "/work" },
  { key: "about", label: "About", href: "/about" },
  { key: "contact", label: "Contact", href: "/contact" },
]

export function HomeHeader({ active }: { active?: NavKey }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className={`${HOME_CONTAINER} flex items-center justify-between py-4`}>
        <Link href="/" className="flex items-center gap-2.5 text-foreground">
          <Image
            src="/logo.webp"
            alt=""
            width={26}
            height={26}
            className="h-[26px] w-[26px] object-contain"
          />
          <span className="text-[15px] font-bold tracking-[0.01em]">Velvet Dinosaur</span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-6 text-[13px] font-medium md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              aria-current={active === link.key ? "page" : undefined}
              className={cn(
                "transition-colors",
                active === link.key
                  ? "border-b-2 border-primary pb-0.5 text-primary"
                  : "text-muted-foreground hover:text-primary",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link href="/contact" className={`${HOME_BTN_PRIMARY} px-5 py-2.5 text-[13px]`}>
          Start your project
        </Link>
      </div>
    </header>
  )
}

export function HomeFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div
        className={`${HOME_CONTAINER} flex flex-wrap items-center justify-between gap-3.5 py-7`}
      >
        <div className="flex items-center gap-2">
          <Image
            src="/logo.webp"
            alt=""
            width={18}
            height={18}
            className="h-[18px] w-[18px] object-contain"
          />
          <span className="text-[12.5px] text-muted-foreground">
            © 2026 Velvet Dinosaur · Minster Lovell, Oxfordshire
          </span>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-5 text-[12.5px] font-medium">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/privacy" className="text-muted-foreground transition-colors hover:text-primary">
            Privacy
          </Link>
          <Link href="/terms" className="text-muted-foreground transition-colors hover:text-primary">
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  )
}
