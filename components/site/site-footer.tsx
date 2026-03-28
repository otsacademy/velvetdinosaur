import Link from "next/link"
import { ArrowRight, Github, Linkedin, Mail } from "lucide-react"

export function SiteFooter() {
  const footerAnchorClass =
    "vd-footer-link inline-flex min-h-11 items-center rounded-md px-1.5 py-2 transition-colors hover:text-foreground"

  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-6 border-b border-border/60 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Velvet Dinosaur</p>
            <p className="max-w-md text-sm text-foreground/80">
              Founder-led bespoke websites and apps that are fast, well built, and easy to own long term.
            </p>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
            >
              Talk through a project
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="mailto:hello@velvetdinosaur.com"
              className="vd-footer-social flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
              aria-label="Email"
            >
              <Mail className="h-4 w-4" />
            </a>
            <a
              href="https://github.com/velvetdinosaur"
              target="_blank"
              rel="noopener noreferrer"
              className="vd-footer-social flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
              aria-label="GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href="https://linkedin.com/in/ianwickens"
              target="_blank"
              rel="noopener noreferrer"
              className="vd-footer-social flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p className="text-xs text-muted-foreground">© 2026 Velvet Dinosaur. All rights reserved.</p>
          <div className="flex flex-col items-center gap-3 sm:items-end">
            <nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:justify-end">
              <a href="#home" className={footerAnchorClass}>Home</a>
              <a href="#services" className={footerAnchorClass}>Services</a>
              <a href="#about" className={footerAnchorClass}>About</a>
              <a href="#portfolio" className={footerAnchorClass}>Portfolio</a>
              <a href="#contact" className={footerAnchorClass}>Contact</a>
            </nav>
            <nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:justify-end">
              <Link href="/privacy" className={footerAnchorClass}>Privacy Policy</Link>
              <Link href="/terms" className={footerAnchorClass}>Terms of Service</Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}
