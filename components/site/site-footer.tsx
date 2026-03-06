import Link from "next/link"
import { ArrowRight, Github, Linkedin, Mail } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-6 md:py-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-6 rounded-2xl border border-border bg-gradient-to-br from-background to-muted/35 p-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Velvet Dinosaur</p>
            <p className="max-w-md text-sm text-foreground/80">
              Bespoke websites and apps that are fast, elegant, and built for long-term ownership.
            </p>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
            >
              Ready to launch something better?
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

        <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p className="text-xs text-muted-foreground">© 2026 Velvet Dinosaur. All rights reserved.</p>
          <div className="flex flex-col items-center gap-2 sm:items-end">
            <nav className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground sm:justify-end">
              <a href="#home" className="vd-footer-link transition-colors hover:text-foreground">Home</a>
              <a href="#services" className="vd-footer-link transition-colors hover:text-foreground">Services</a>
              <a href="#about" className="vd-footer-link transition-colors hover:text-foreground">About</a>
              <a href="#portfolio" className="vd-footer-link transition-colors hover:text-foreground">Portfolio</a>
              <a href="#contact" className="vd-footer-link transition-colors hover:text-foreground">Contact</a>
            </nav>
            <nav className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground sm:justify-end">
              <Link href="/privacy" className="vd-footer-link transition-colors hover:text-foreground">Privacy Policy</Link>
              <Link href="/terms" className="vd-footer-link transition-colors hover:text-foreground">Terms of Service</Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}
