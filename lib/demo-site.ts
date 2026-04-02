import { resolveSiteUrl } from "@/lib/site-metadata"

export type DemoFeatureSlug =
  | "new"
  | "news"
  | "contact-templates"
  | "newsletter"
  | "reviews"
  | "stays"
  | "routes"
  | "bookings"
  | "theme-editor"
  | "inbox"
  | "calendar"
  | "media"
  | "support"
export type DemoRouteVariant = "host" | "path"

export type DemoFeature = {
  slug: DemoFeatureSlug
  path: `/${DemoFeatureSlug}`
  eyebrow: string
  title: string
  description: string
  bullets: string[]
}

export const demoFeatures: DemoFeature[] = [
  {
    slug: "new",
    path: "/new",
    eyebrow: "Live page editor",
    title: "Page Editor",
    description: "Open the real page editor surface with the full component library, media picker, and theme drawer.",
    bullets: ["Same editor shell as the platform", "Disposable uploads and previews", "No permanent saves or publishing"]
  },
  {
    slug: "news",
    path: "/news",
    eyebrow: "Editorial workflow",
    title: "Article Editor",
    description: "Write, preview, save, publish, and organise a fictional article in the same long-form workspace used for editorial demos.",
    bullets: ["Fictional article content", "Preview and version history", "Sandboxed save and publish flow"]
  },
  {
    slug: "contact-templates",
    path: "/contact-templates",
    eyebrow: "System email",
    title: "Contact Templates",
    description: "Edit token-aware system emails with preview, source tabs, and template-level statuses in a safe sandbox.",
    bullets: ["Fictional template copy", "Preview with sample tokens", "Demo-only saves"]
  },
  {
    slug: "newsletter",
    path: "/newsletter",
    eyebrow: "Email campaigns",
    title: "Newsletter",
    description: "Draft campaigns, queue a send, inspect delivery logs, and explore deliverability controls without a real mail backend.",
    bullets: ["Dummy subscribers", "Queue and dispatch demo flow", "No live mail provider writes"]
  },
  {
    slug: "reviews",
    path: "/reviews",
    eyebrow: "Review workflow",
    title: "Reviews",
    description: "Issue review links, track comment progress, and resolve notes in the same shared feedback workspace.",
    bullets: ["Fictional review links", "Comment progress dashboard", "Local-only reviewer actions"]
  },
  {
    slug: "stays",
    path: "/stays",
    eyebrow: "Travel inventory",
    title: "Stays",
    description: "Manage a fictional portfolio of stays with imagery, pricing, capacity, and route links in a safe travel demo.",
    bullets: ["Cross-linked stay records", "Demo-only image uploads", "Reset on refresh"]
  },
  {
    slug: "routes",
    path: "/routes",
    eyebrow: "Tours and routes",
    title: "Routes",
    description: "Edit route summaries, durations, linked stays, and itineraries using a fictional travel programme.",
    bullets: ["Mixed route and stay data", "Live table edits", "Sandboxed planner state"]
  },
  {
    slug: "bookings",
    path: "/bookings",
    eyebrow: "Booking operations",
    title: "Booking API",
    description: "Review demo inventory mappings, pipeline activity, and availability without touching a live booking backend.",
    bullets: ["Stay and route inventory", "Local-only booking actions", "Disposable availability updates"]
  },
  {
    slug: "theme-editor",
    path: "/theme-editor",
    eyebrow: "OKLCH theming",
    title: "Theme Editor",
    description: "Dial the palette, contrast, and corner radius, then watch the interface update live.",
    bullets: ["Live token preview", "Preset starting points", "No save required"]
  },
  {
    slug: "inbox",
    path: "/inbox",
    eyebrow: "Leads and bookings",
    title: "Inbox",
    description: "Triage enquiries, draft replies, and move leads toward calls and bookings in one place.",
    bullets: ["Dummy enquiries", "Status changes", "Safe demo state"]
  },
  {
    slug: "calendar",
    path: "/calendar",
    eyebrow: "Scheduling",
    title: "Calendar",
    description: "Manage discovery calls, launch reviews, and internal handovers in the same workspace.",
    bullets: ["Fictional events", "Local-only edits", "Reset on refresh"]
  },
  {
    slug: "media",
    path: "/media",
    eyebrow: "Asset management",
    title: "Media Library",
    description: "Browse seeded folders, upload files, edit metadata, and organise assets without touching live storage.",
    bullets: ["Fictional asset folders", "Disposable uploads", "Real media workflow"]
  },
  {
    slug: "support",
    path: "/support",
    eyebrow: "Customer support",
    title: "Support Portal",
    description: "Track requests, draft replies, and explore the support toolkit in a fully sandboxed portal.",
    bullets: ["Dummy tickets", "Local-only replies", "Reset on refresh"]
  }
]

const ALLOWED_DEMO_PATHS = new Set([
  "/",
  "/new",
  "/news",
  "/contact-templates",
  "/newsletter",
  "/reviews",
  "/stays",
  "/routes",
  "/bookings",
  "/theme-editor",
  "/inbox",
  "/calendar",
  "/media",
  "/support",
])

function normalizeHost(value?: string | null) {
  if (!value) return null
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
}

function normalizeAbsoluteUrl(value?: string | null) {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  try {
    return new URL(trimmed).toString().replace(/\/$/, "")
  } catch {
    return null
  }
}

function appendPath(base: string, path: string) {
  const nextPath = path.startsWith("/") ? path : `/${path}`
  if (/^https?:\/\//i.test(base)) {
    return new URL(nextPath, `${base}/`).toString().replace(/\/$/, "")
  }
  const normalizedBase = base === "/" ? "" : base.replace(/\/$/, "")
  return `${normalizedBase}${nextPath}` || "/"
}

function resolveConfiguredDemoSiteUrl() {
  return normalizeAbsoluteUrl(process.env.NEXT_PUBLIC_DEMO_SITE_URL || process.env.DEMO_SITE_URL)
}

export function resolveDemoSiteUrl(path = "/") {
  const configured = resolveConfiguredDemoSiteUrl()
  if (configured) {
    return appendPath(configured, path)
  }

  const siteUrl = resolveSiteUrl()
  try {
    const url = new URL(siteUrl)
    const hostname = url.hostname.replace(/^www\./, "")
    if (!["localhost", "127.0.0.1"].includes(hostname)) {
      url.hostname = hostname.startsWith("demo.") ? hostname : `demo.${hostname}`
      return appendPath(url.toString().replace(/\/$/, ""), path)
    }
  } catch {
    // Fall through to local path-based demo routing.
  }

  return appendPath("/demo", path)
}

export function resolvePrimarySiteUrl(path = "/") {
  return appendPath(resolveSiteUrl(), path)
}

export function getDemoDefaultWorkspacePath(variant: DemoRouteVariant) {
  return variant === "path" ? "/demo" : "/"
}

export function getDemoRoutePath(path: string, variant: DemoRouteVariant) {
  const fallback = getDemoDefaultWorkspacePath(variant)

  try {
    const parsed = new URL(path, "https://demo.local")
    let pathname = parsed.pathname

    if (pathname === "/demo") pathname = "/"
    if (pathname.startsWith("/demo/")) {
      pathname = pathname.slice("/demo".length) || "/"
    }

    if (!ALLOWED_DEMO_PATHS.has(pathname)) {
      return fallback
    }

    if (variant === "path") {
      const basePath = pathname === "/" ? "/demo" : `/demo${pathname}`
      return `${basePath}${parsed.search}`
    }

    return `${pathname}${parsed.search}`
  } catch {
    return fallback
  }
}

export function getDemoLoginPath(nextPath: string, variant: DemoRouteVariant) {
  const resolvedNextPath = getDemoRoutePath(nextPath, variant)
  const base = variant === "path" ? "/demo/login" : "/login"
  return `${base}?next=${encodeURIComponent(resolvedNextPath)}`
}

export function resolveDemoLoginUrl(nextPath: string) {
  return resolveDemoSiteUrl(getDemoLoginPath(nextPath, "host"))
}

export function getRequestHost(requestHeaders: Headers) {
  return normalizeHost(
    requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || requestHeaders.get(":authority")
  )
}

export function isDemoHost(host?: string | null) {
  const normalized = normalizeHost(host)
  if (!normalized) return false

  const configured = resolveConfiguredDemoSiteUrl()
  if (configured && normalized === normalizeHost(configured)) {
    return true
  }

  return normalized.startsWith("demo.")
}

export function isDemoRequest(requestHeaders: Headers) {
  return isDemoHost(getRequestHost(requestHeaders))
}

export function getDemoFeature(slug: DemoFeatureSlug) {
  return demoFeatures.find((feature) => feature.slug === slug) ?? null
}
