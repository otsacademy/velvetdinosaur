"use client"

import { useId } from "react"
import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

type MobileNavSheetProps = {
  links: { label: string; href: string }[]
  ctaLabel: string
  ctaHref: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileNavSheet({ links, ctaLabel, ctaHref, open, onOpenChange }: MobileNavSheetProps) {
  const contentId = useId()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open navigation menu"
          aria-expanded={open}
          aria-controls={contentId}
          aria-haspopup="dialog"
          className="text-background hover:bg-background/10 hover:text-background dark:text-card-foreground dark:hover:bg-card-foreground/10"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        id={contentId}
        side="right"
        className="w-72 bg-background motion-reduce:transition-none motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=closed]:animate-none"
      >
        <SheetHeader className="px-6 pt-6">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
        </SheetHeader>
        <nav aria-label="Mobile" className="flex flex-col gap-4 px-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => onOpenChange(false)}
              className="text-base font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:underline focus-visible:decoration-primary/60 focus-visible:underline-offset-4"
            >
              {link.label}
            </Link>
          ))}
          <Button asChild className="mt-3 w-full">
            <Link href={ctaHref} onClick={() => onOpenChange(false)}>
              {ctaLabel}
            </Link>
          </Button>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
