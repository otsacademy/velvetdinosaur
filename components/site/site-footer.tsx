import { Github, Linkedin, Mail } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-8 md:py-10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <p className="text-sm font-medium text-foreground">Velvet Dinosaur</p>
            <p className="text-sm text-muted-foreground">
              Bespoke websites and apps built to last.
            </p>
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

        <div className="mt-6 flex flex-col items-center gap-2 border-t border-border pt-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-xs text-muted-foreground">
            © 2026 Velvet Dinosaur. All rights reserved.
          </p>
          <nav className="flex gap-4 text-xs text-muted-foreground">
            <a href="#home" className="vd-footer-link transition-colors hover:text-foreground">Home</a>
            <a href="#services" className="vd-footer-link transition-colors hover:text-foreground">Services</a>
            <a href="#about" className="vd-footer-link transition-colors hover:text-foreground">About</a>
            <a href="#portfolio" className="vd-footer-link transition-colors hover:text-foreground">Portfolio</a>
          </nav>
        </div>
      </div>
    </footer>
  )
}
