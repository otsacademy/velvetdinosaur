"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
import type { ComponentConfig } from "@measured/puck"
import {
  Bell,
  Book,
  ChevronRight,
  FileText,
  Globe,
  Grid,
  HelpCircle,
  Info,
  Menu,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { ShadcnblocksContainer } from "@/components/blocks/store/shadcnblocks/shared"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"

const NAV_ICONS = {
  Bell,
  Book,
  FileText,
  Globe,
  Grid,
  HelpCircle,
  Info,
} as const

type NavIconName = keyof typeof NAV_ICONS

type MenuLink = {
  label: string
  description?: string
  href?: string
  icon?: NavIconName | ""
}

type MenuItem = {
  title: string
  href?: string
  links?: MenuLink[]
}

type Logo = {
  url: string
  src: string
  alt: string
  title: string
}

type PrimaryButton = {
  label: string
  href: string
}

export type ShadcnblocksNavbar9Props = {
  logo: Logo
  navigation: MenuItem[]
  primaryButton: PrimaryButton
  githubRepoUrl?: string
  showGithubStars?: "true" | "false"
  mobileTitle?: string
}

const MOBILE_BREAKPOINT = 1024
const DEFAULT_LOGO: Logo = {
  url: "https://www.shadcnblocks.com",
  src: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/block-1.svg",
  alt: "logo",
  title: "Shadcnblocks.com",
}
const DEFAULT_PRIMARY_BUTTON: PrimaryButton = {
  label: "Sign up",
  href: "#",
}
const DEFAULT_MOBILE_TITLE = "Mobile Navigation"
const DEFAULT_NAVIGATION: MenuItem[] = [
  {
    title: "Products",
    links: [
      {
        label: "Company Blog",
        description: "Insights & updates",
        href: "#",
        icon: "FileText",
      },
      {
        label: "Our Platform",
        description: "Empower your work",
        href: "#",
        icon: "Grid",
      },
    ],
  },
  {
    title: "Company",
    links: [
      {
        label: "About Our Team",
        description: "Our mission & values",
        href: "#",
        icon: "Info",
      },
      {
        label: "Help & Support Center",
        description: "Get quick help",
        href: "#",
        icon: "HelpCircle",
      },
      {
        label: "Latest News",
        description: "Product updates",
        href: "#",
        icon: "Bell",
      },
    ],
  },
  {
    title: "Resources",
    links: [
      {
        label: "Documentation",
        description: "Guides & references",
        href: "#",
        icon: "Book",
      },
      {
        label: "API Reference",
        description: "Explore our API",
        href: "#",
        icon: "Globe",
      },
    ],
  },
  { title: "Pricing", href: "#" },
  { title: "Contact", href: "#" },
]

function GithubStars({ repoUrl }: { repoUrl: string }) {
  const [stargazersCount, setStargazersCount] = useState<string>("")

  const [owner, repo] = repoUrl.split("github.com/")[1]?.split("/") || []
  const githubApiEndpoint = owner && repo ? `https://api.github.com/repos/${owner}/${repo}` : ""

  const formatStargazers = (count: number | ""): string => {
    if (count === "") return ""
    if (count < 1000) return count.toString()
    return `${Math.round(count / 1000)}k`
  }

  useEffect(() => {
    if (!githubApiEndpoint) return
    const getStars = async () => {
      try {
        const response = await fetch(githubApiEndpoint)
        const json = await response.json()
        const formattedCount = formatStargazers(json.stargazers_count)
        setStargazersCount(formattedCount)
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error(error.message)
        }
      }
    }

    getStars()
  }, [githubApiEndpoint])

  if (!repoUrl) return null

  return (
    <Button
      variant="ghost"
      asChild
      className="flex items-center gap-1.5 bg-muted text-foreground"
    >
      <a href={repoUrl}>
        <svg width="800px" height="800px" viewBox="0 0 20 20">
          <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
            <g transform="translate(-140.000000, -7559.000000)" fill="currentColor">
              <g transform="translate(56.000000, 160.000000)">
                <path d="M94,7399 C99.523,7399 104,7403.59 104,7409.253 C104,7413.782 101.138,7417.624 97.167,7418.981 C96.66,7419.082 96.48,7418.762 96.48,7418.489 C96.48,7418.151 96.492,7417.047 96.492,7415.675 C96.492,7414.719 96.172,7414.095 95.813,7413.777 C98.04,7413.523 100.38,7412.656 100.38,7408.718 C100.38,7407.598 99.992,7406.684 99.35,7405.966 C99.454,7405.707 99.797,7404.664 99.252,7403.252 C99.252,7403.252 98.414,7402.977 96.505,7404.303 C95.706,7404.076 94.85,7403.962 94,7403.958 C93.15,7403.962 92.295,7404.076 91.497,7404.303 C89.586,7402.977 88.746,7403.252 88.746,7403.252 C88.203,7404.664 88.546,7405.707 88.649,7405.966 C88.01,7406.684 87.619,7407.598 87.619,7408.718 C87.619,7412.646 89.954,7413.526 92.175,7413.785 C91.889,7414.041 91.63,7414.493 91.54,7415.156 C90.97,7415.418 89.522,7415.871 88.63,7414.304 C88.63,7414.304 88.101,7413.319 87.097,7413.247 C87.097,7413.247 86.122,7413.234 87.029,7413.87 C87.029,7413.87 87.684,7414.185 88.139,7415.37 C88.139,7415.37 88.726,7417.2 91.508,7416.58 C91.513,7417.437 91.522,7418.245 91.522,7418.489 C91.522,7418.76 91.338,7419.077 90.839,7418.982 C86.865,7417.627 84,7413.783 84,7409.253 C84,7403.59 88.478,7399 94,7399" />
              </g>
            </g>
          </g>
        </svg>
        <span>{stargazersCount}</span>
      </a>
    </Button>
  )
}

function MenuSubLink({ link }: { link: MenuLink }) {
  const Icon = link.icon ? NAV_ICONS[link.icon] : null
  return (
    <a
      href={link.href}
      className="flex items-center gap-4 rounded-lg p-2 hover:bg-muted"
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex gap-2.5">
          {Icon ? <Icon className="size-5 text-primary" /> : null}
          <div className="flex flex-col gap-1.5">
            <h3 className="text-sm leading-none text-foreground">{link.label}</h3>
            {link.description ? (
              <p className="text-sm leading-[1.2] text-muted-foreground/80">
                {link.description}
              </p>
            ) : null}
          </div>
        </div>
        <ChevronRight className="size-3.5 stroke-muted-foreground opacity-100" />
      </div>
    </a>
  )
}

function DesktopMenuItem({ item, index }: { item: MenuItem; index: number }) {
  if (item.links?.length) {
    return (
      <NavigationMenuItem key={`desktop-menu-item-${index}`} value={`${index}`}>
        <NavigationMenuTrigger className="h-fit bg-transparent font-normal text-foreground focus:!bg-transparent data-[active=true]:!bg-transparent">
          {item.title}
        </NavigationMenuTrigger>
        <NavigationMenuContent className="!rounded-xl !p-0">
          <ul className="w-[20rem] p-2.5">
            {item.links.map((link, idx) => (
              <li key={`desktop-nav-sublink-${idx}`}>
                <MenuSubLink link={link} />
              </li>
            ))}
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
    )
  }

  return (
    <NavigationMenuItem key={`desktop-menu-item-${index}`} value={`${index}`}>
      <NavigationMenuLink
        href={item.href}
        className={`${navigationMenuTriggerStyle()} h-fit bg-transparent font-normal text-foreground`}
      >
        {item.title}
      </NavigationMenuLink>
    </NavigationMenuItem>
  )
}

function MobileNavigationMenu({
  open,
  navigation,
  primaryButton,
  mobileTitle,
}: {
  open: boolean
  navigation: MenuItem[]
  primaryButton: PrimaryButton
  mobileTitle: string
}) {
  return (
    <Sheet open={open}>
      <SheetContent
        aria-describedby={undefined}
        side="top"
        className="inset-0 z-998 h-dvh w-full bg-background pt-16 [&>button]:hidden"
      >
        <div className="flex-1 overflow-y-auto">
          <div className="container pb-12">
            <div className="absolute -m-px h-px w-px overflow-hidden border-0 mask-clip-border p-0 text-nowrap whitespace-nowrap">
              <SheetTitle className="text-primary">{mobileTitle}</SheetTitle>
            </div>
            <div className="flex h-full flex-col justify-between gap-20">
              <Accordion type="multiple" className="w-full">
                {navigation.map((item, index) => {
                  if (item.links?.length) {
                    return (
                      <AccordionItem key={item.title} value={`nav-${index}`}>
                        <AccordionTrigger className="h-[3.75rem] items-center p-0 text-base leading-[3.75] font-normal text-muted-foreground hover:no-underline">
                          {item.title}
                        </AccordionTrigger>
                        <AccordionContent>
                          {item.links.map((subItem) => (
                            <MenuSubLink key={subItem.label} link={subItem} />
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    )
                  }

                  return (
                    <a
                      key={item.title}
                      href={item.href}
                      className="flex h-[3.75rem] items-center border-b p-0 text-left text-base leading-[3.75] font-normal text-muted-foreground ring-ring/10 outline-ring/50 transition-all focus-visible:ring-4 focus-visible:outline-1 nth-last-1:border-0"
                    >
                      {item.title}
                    </a>
                  )
                })}
              </Accordion>
              <div className="pb-20">
                <Button asChild className="w-full">
                  <a href={primaryButton.href}>{primaryButton.label}</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function ShadcnblocksNavbar9(props: ShadcnblocksNavbar9Props) {
  const [open, setOpen] = useState<boolean>(false)
  const logo = { ...DEFAULT_LOGO, ...(props.logo || {}) }
  const primaryButton = { ...DEFAULT_PRIMARY_BUTTON, ...(props.primaryButton || {}) }
  const navigation = props.navigation?.length ? props.navigation : DEFAULT_NAVIGATION

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > MOBILE_BREAKPOINT) {
        setOpen(false)
      }
    }

    handleResize()

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto"
  }, [open])

  const handleMobileMenu = () => {
    const nextOpen = !open
    setOpen(nextOpen)
  }

  const showGithubStars = props.showGithubStars !== "false" && Boolean(props.githubRepoUrl)
  const mobileTitle = props.mobileTitle || DEFAULT_MOBILE_TITLE

  const sanitizedNav = useMemo(() => navigation || [], [navigation])

  return (
    <ShadcnblocksContainer>
      <Fragment>
        <section className={cn("pointer-events-auto relative z-50 bg-background")}> 
          <div className="container h-16">
            <div className="flex h-full items-center justify-between">
              <a
                href={logo.url}
                className="flex max-h-8 items-center gap-2 text-lg font-semibold tracking-tighter"
              >
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="inline-block size-8"
                />
                <span className="hidden text-foreground md:inline-block">
                  {logo.title}
                </span>
              </a>
              <NavigationMenu className="hidden lg:flex" viewport={false}>
                <NavigationMenuList>
                  {sanitizedNav.map((item, index) => (
                    <DesktopMenuItem
                      key={`desktop-link-${index}`}
                      item={item}
                      index={index}
                    />
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
              <div className="flex items-center gap-4">
                {showGithubStars ? (
                  <GithubStars repoUrl={props.githubRepoUrl || ""} />
                ) : null}
                <Button asChild>
                  <a href={primaryButton.href}>{primaryButton.label}</a>
                </Button>
                <div className="lg:hidden">
                  <Button variant="ghost" size="icon" onClick={handleMobileMenu}>
                    {open ? (
                      <X className="size-5.5 stroke-foreground" />
                    ) : (
                      <Menu className="size-5.5 stroke-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
        <MobileNavigationMenu
          open={open}
          navigation={sanitizedNav}
          primaryButton={primaryButton}
          mobileTitle={mobileTitle}
        />
      </Fragment>
    </ShadcnblocksContainer>
  )
}

export const shadcnblocksNavbar9Config: ComponentConfig<ShadcnblocksNavbar9Props> = {
  fields: {
    logo: {
      type: "object",
      objectFields: {
        url: { type: "text" },
        src: { type: "text" },
        alt: { type: "text" },
        title: { type: "text" },
      },
    },
    navigation: {
      type: "array",
      arrayFields: {
        title: { type: "text" },
        href: { type: "text" },
        links: {
          type: "array",
          arrayFields: {
            label: { type: "text" },
            description: { type: "textarea" },
            href: { type: "text" },
            icon: {
              type: "select",
              options: [
                { label: "None", value: "" },
                { label: "Bell", value: "Bell" },
                { label: "Book", value: "Book" },
                { label: "FileText", value: "FileText" },
                { label: "Globe", value: "Globe" },
                { label: "Grid", value: "Grid" },
                { label: "HelpCircle", value: "HelpCircle" },
                { label: "Info", value: "Info" },
              ],
            },
          },
        },
      },
    },
    primaryButton: {
      type: "object",
      objectFields: {
        label: { type: "text" },
        href: { type: "text" },
      },
    },
    githubRepoUrl: { type: "text" },
    showGithubStars: {
      type: "select",
      options: [
        { label: "Show", value: "true" },
        { label: "Hide", value: "false" },
      ],
    },
    mobileTitle: { type: "text" },
  },
  defaultProps: {
    logo: {
      url: "https://www.shadcnblocks.com",
      src: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/block-1.svg",
      alt: "logo",
      title: "Shadcnblocks.com",
    },
    navigation: [
      {
        title: "Products",
        links: [
          {
            label: "Company Blog",
            description: "Insights & updates",
            href: "#",
            icon: "FileText",
          },
          {
            label: "Our Platform",
            description: "Empower your work",
            href: "#",
            icon: "Grid",
          },
        ],
      },
      {
        title: "Company",
        links: [
          {
            label: "About Our Team",
            description: "Our mission & values",
            href: "#",
            icon: "Info",
          },
          {
            label: "Help & Support Center",
            description: "Get quick help",
            href: "#",
            icon: "HelpCircle",
          },
          {
            label: "Latest News",
            description: "Product updates",
            href: "#",
            icon: "Bell",
          },
        ],
      },
      {
        title: "Resources",
        links: [
          {
            label: "Documentation",
            description: "Guides & references",
            href: "#",
            icon: "Book",
          },
          {
            label: "API Reference",
            description: "Explore our API",
            href: "#",
            icon: "Globe",
          },
        ],
      },
      { title: "Pricing", href: "#" },
      { title: "Contact", href: "#" },
    ],
    primaryButton: {
      label: "Sign up",
      href: "#",
    },
    githubRepoUrl: "https://github.com/shadcn/ui",
    showGithubStars: "true",
    mobileTitle: "Mobile Navigation",
  },
  render: (props) => <ShadcnblocksNavbar9 {...props} />,
}
