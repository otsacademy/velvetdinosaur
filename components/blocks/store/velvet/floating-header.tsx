"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { ComponentConfig } from "@measured/puck"

import { EditableImage, EditableText } from "@/components/demo/editable"
import { demoKey } from "@/components/demo/demo-helpers"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { MobileNavSheet } from "@/components/blocks/store/velvet/shared/mobile-nav-sheet"

type NavLink = {
  label: string
  href: string
}

export type FloatingHeaderProps = {
  id?: string
  logoUrl: string
  logoAlt: string
  brandName: string
  links: NavLink[]
  ctaLabel: string
  ctaHref: string
}

export function FloatingHeader(props: FloatingHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const key = (path: string) => demoKey(props.id, path)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-50 pointer-events-none">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div
          className={cn(
            "pointer-events-auto mt-4 rounded-2xl border backdrop-blur-xl transition-all duration-500 ease-out motion-reduce:transition-none",
            "text-background dark:text-card-foreground",
            isScrolled
              ? "bg-foreground/95 border-border/40 shadow-lg dark:bg-card/95"
              : "bg-foreground/85 border-transparent shadow-md dark:bg-card/85",
          )}
        >
          <nav
            aria-label="Primary"
            className={cn(
              "grid grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-6",
              isScrolled ? "py-3" : "py-4",
            )}
          >
            <Link href="/" className="flex items-center gap-2 font-semibold text-base">
              <span className="relative h-9 w-9">
                <EditableImage
                  demoKey={key("brand.logo")}
                  src={props.logoUrl}
                  alt={props.logoAlt}
                  width={40}
                  height={40}
                  className="h-9 w-9 object-contain"
                />
              </span>
              <EditableText demoKey={key("brand.name")} value={props.brandName} as="span" showIcon={false} />
            </Link>

            <div className="hidden md:flex items-center justify-center gap-8">
              {props.links.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative text-sm font-medium text-background/70 transition-colors hover:text-background focus-visible:outline-none group dark:text-card-foreground/70 dark:hover:text-card-foreground"
                >
                  <EditableText
                    demoKey={key(`nav.links.${index}.label`)}
                    value={link.label}
                    as="span"
                    showIcon={false}
                  />
                  <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                </Link>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2">
              <div className="hidden md:flex">
                <Button asChild className="shadow-sm hover:shadow-md">
                  <Link href={props.ctaHref}>
                    <EditableText demoKey={key("nav.cta")} value={props.ctaLabel} as="span" showIcon={false} />
                  </Link>
                </Button>
              </div>
              <div className="md:hidden">
                <MobileNavSheet
                  links={props.links}
                  ctaLabel={props.ctaLabel}
                  ctaHref={props.ctaHref}
                  open={isMenuOpen}
                  onOpenChange={setIsMenuOpen}
                />
              </div>
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}

export const floatingHeaderConfig: ComponentConfig<FloatingHeaderProps> = {
  fields: {
    logoUrl: { type: "text" },
    logoAlt: { type: "text" },
    brandName: { type: "text" },
    links: {
      type: "array",
      arrayFields: {
        label: { type: "text" },
        href: { type: "text" },
      },
    },
    ctaLabel: { type: "text" },
    ctaHref: { type: "text" },
  },
  defaultProps: {
    logoUrl: "",
    logoAlt: "",
    brandName: "",
    links: [],
    ctaLabel: "",
    ctaHref: "",
  },
  render: (props) => <FloatingHeader {...props} />,
}
