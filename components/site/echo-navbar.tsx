"use client"

import type { ElementType, MouseEvent } from "react"
import { useEffect, useState } from "react"
import { Briefcase, House, Images, Mail, Moon, Sun, UserRound } from "lucide-react"

import { cn } from "@/lib/utils"

interface NavItem {
  icon: ElementType
  label: string
  href: string
}

const navItems: NavItem[] = [
  { icon: House, label: "Home", href: "#home" },
  { icon: Briefcase, label: "Services", href: "#services" },
  { icon: UserRound, label: "About", href: "#about" },
  { icon: Images, label: "Work", href: "#portfolio" },
]

function NavButton({
  icon: Icon,
  label,
  href,
  isActive,
  highlight,
  onClick,
}: NavItem & {
  isActive?: boolean
  highlight?: boolean
  onClick?: () => void
}) {
  const isExternal = href.startsWith("mailto:") || href.startsWith("http")

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
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
    <a
      href={href}
      onClick={handleClick}
      className={cn(
        "vd-nav-icon inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors",
        highlight
          ? "border-primary/35 bg-primary text-primary-foreground hover:bg-primary/90"
          : isActive
            ? "border-primary/30 bg-primary/10 text-foreground"
            : "border-border bg-background/80 text-muted-foreground hover:text-foreground"
      )}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="h-4 w-4" />
      <span className="vd-nav-icon-label leading-none">{label}</span>
    </a>
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

  return (
    <button
      onClick={toggleTheme}
      className="vd-theme-toggle inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground transition-colors hover:text-foreground"
      aria-label={mounted ? (isDark ? "Switch to light mode" : "Switch to dark mode") : "Toggle theme"}
      type="button"
    >
      {mounted && isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  )
}

export function EchoNavbar() {
  const [activeSection, setActiveSection] = useState("home")

  useEffect(() => {
    const handleScroll = () => {
      const sections = navItems.map((item) => item.href.replace("#", ""))
      const scrollPosition = window.scrollY + 180

      for (let index = sections.length - 1; index >= 0; index -= 1) {
        const section = document.getElementById(sections[index])
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(sections[index])
          break
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header className="supports-backdrop-filter:bg-background/60 fixed left-0 right-0 top-0 z-50 w-full backdrop-blur">
      <div className="mx-auto mt-4 max-w-6xl px-4 md:mt-6 md:px-6">
        <div className="flex items-center gap-2 rounded-full bg-background/70 p-2 shadow-[0_18px_36px_-30px_color-mix(in_oklch,oklch(var(--vd-foreground))_30%,transparent)]">
          <nav className="flex min-w-0 grow items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
            {navItems.map((item) => (
              <NavButton
                key={item.href}
                {...item}
                isActive={activeSection === item.href.replace("#", "")}
              />
            ))}
          </nav>
          <ThemeToggle />
          <NavButton icon={Mail} label="Contact" href="#contact" highlight />
        </div>
      </div>
    </header>
  )
}
