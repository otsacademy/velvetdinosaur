"use client"

import { House, Briefcase, User, Sparkles, Mail, Sun, Moon } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface NavItem {
  icon: React.ElementType
  label: string
  href: string
}

const navItems: NavItem[] = [
  { icon: House, label: "Home", href: "#home" },
  { icon: Briefcase, label: "Services", href: "#services" },
  { icon: User, label: "About", href: "#about" },
  { icon: Sparkles, label: "Portfolio", href: "#portfolio" },
]

function NavButton({
  icon: Icon,
  label,
  href,
  isActive,
  onClick,
}: NavItem & { isActive?: boolean; onClick?: () => void }) {
  const isExternal = href.startsWith("mailto:") || href.startsWith("http")

  const handleClick = (e: React.MouseEvent) => {
    if (!isExternal && href.startsWith("#")) {
      e.preventDefault()
      const target = document.querySelector(href)
      if (target) {
        target.scrollIntoView({ behavior: "smooth" })
      }
      onClick?.()
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={href}
          onClick={handleClick}
          className={cn(
            "vd-nav-icon flex h-10 w-10 items-center justify-center rounded-full transition-colors",
            isActive
              ? "bg-foreground/15 text-foreground"
              : "bg-muted text-muted-foreground hover:text-primary"
          )}
          aria-label={label}
        >
          <Icon className="vd-nav-icon-svg h-5 w-5" />
        </a>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={8}>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  )
}

function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const shouldUseDark = storedTheme ? storedTheme === "dark" : prefersDark
    document.documentElement.classList.toggle("dark", shouldUseDark)
    setIsDark(shouldUseDark)
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    document.documentElement.classList.toggle("dark", newIsDark)
    localStorage.setItem("theme", newIsDark ? "dark" : "light")
  }

  if (!mounted) {
    return (
      <button
        className="vd-theme-toggle flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
        aria-label="Toggle theme"
      >
        <Sun className="h-5 w-5" />
      </button>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={toggleTheme}
          className="vd-theme-toggle flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={8}>
        <p>{isDark ? "Light mode" : "Dark mode"}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export function EchoNavbar() {
  const [activeSection, setActiveSection] = useState("home")

  useEffect(() => {
    const handleScroll = () => {
      const sections = navItems.map((item) => item.href.replace("#", ""))
      const scrollPosition = window.scrollY + 200

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i])
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(sections[i])
          break
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <TooltipProvider delayDuration={100}>
      <header className="supports-backdrop-filter:bg-background/60 fixed left-0 right-0 top-0 z-50 w-full backdrop-blur">
        <nav className="mx-auto mt-5 flex max-w-6xl items-center justify-between gap-4 px-6 md:mt-8">
          <div className="flex items-center gap-3">
            {navItems.map((item) => (
              <NavButton
                key={item.href}
                {...item}
                isActive={activeSection === item.href.replace("#", "")}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <NavButton
              icon={Mail}
              label="Contact"
              href="#contact"
            />
          </div>
        </nav>
      </header>
    </TooltipProvider>
  )
}
