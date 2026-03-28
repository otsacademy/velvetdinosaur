import { DemoBookings } from "@/components/demo/demo-bookings.client"
import { DemoHome } from "@/components/demo/demo-home"
import { DemoCalendar } from "@/components/demo/demo-calendar.client"
import { DemoContactTemplates } from "@/components/demo/demo-contact-templates.client"
import { DemoEditorClient } from "@/components/demo/demo-editor.client"
import { DemoInbox } from "@/components/demo/demo-inbox.client"
import { DemoLoginPage } from "@/components/demo/demo-login-page"
import { DemoMedia } from "@/components/demo/demo-media.client"
import { DemoNewsletter } from "@/components/demo/demo-newsletter.client"
import { DemoOnboardingControls } from "@/components/demo/onboarding/demo-onboarding-controls.client"
import { DemoReviews } from "@/components/demo/demo-reviews.client"
import { DemoRoutes } from "@/components/demo/demo-routes.client"
import { DemoShell } from "@/components/demo/demo-shell"
import { DemoStays } from "@/components/demo/demo-stays.client"
import { DemoSupport } from "@/components/demo/demo-support.client"
import { DemoThemeEditor } from "@/components/demo/demo-theme-editor.client"
import { getDemoRoutePath, resolvePrimarySiteUrl, type DemoRouteVariant } from "@/lib/demo-site"

type DemoPageProps = {
  variant: DemoRouteVariant
}

type DemoLoginWorkspacePageProps = DemoPageProps & {
  nextPath: string
}

export function DemoHomePage({ variant }: DemoPageProps) {
  return (
    <DemoShell
      currentPath="/"
      variant={variant}
      mode="landing"
      title="A safe public sandbox for exploring Sauro CMS."
      description="Use this as a marketing and sales layer: prospects can open the feature demos directly, test the workflow, and leave without creating any permanent changes."
    >
      <DemoHome variant={variant} />
    </DemoShell>
  )
}

export function DemoLoginWorkspacePage({ nextPath, variant }: DemoLoginWorkspacePageProps) {
  return <DemoLoginPage nextPath={nextPath} landingHref={getDemoRoutePath("/", variant)} variant={variant} />
}

export function DemoNewPage() {
  return <DemoEditorClient initialSlug="new-page" closeHref="/" />
}

export function DemoThemeEditorPage({ variant }: DemoPageProps) {
  return (
    <DemoShell
      currentPath="/theme-editor"
      variant={variant}
      title="Theme Editor demo with live OKLCH tokens."
      description="Prospects can push the palette around, switch modes, and understand how the design system behaves before a project is commissioned."
      headerAccessory={<DemoOnboardingControls pageKey="theme" />}
    >
      <DemoThemeEditor />
    </DemoShell>
  )
}

export function DemoInboxPage(_: DemoPageProps) {
  return <DemoInbox mainSiteHref={resolvePrimarySiteUrl("/")} />
}

export function DemoContactTemplatesPage(_: DemoPageProps) {
  return <DemoContactTemplates mainSiteHref={resolvePrimarySiteUrl("/")} />
}

export function DemoNewsletterPage(_: DemoPageProps) {
  return <DemoNewsletter mainSiteHref={resolvePrimarySiteUrl("/")} />
}

export function DemoReviewsPage(_: DemoPageProps) {
  return <DemoReviews mainSiteHref={resolvePrimarySiteUrl("/")} />
}

export function DemoCalendarPage(_: DemoPageProps) {
  return <DemoCalendar mainSiteHref={resolvePrimarySiteUrl("/")} />
}

export function DemoMediaPage(_: DemoPageProps) {
  return <DemoMedia mainSiteHref={resolvePrimarySiteUrl("/")} />
}

export function DemoSupportPage(_: DemoPageProps) {
  return <DemoSupport mainSiteHref={resolvePrimarySiteUrl("/")} />
}

export function DemoStaysPage(_: DemoPageProps) {
  return <DemoStays mainSiteHref={resolvePrimarySiteUrl("/")} />
}

export function DemoRoutesPage(_: DemoPageProps) {
  return <DemoRoutes mainSiteHref={resolvePrimarySiteUrl("/")} />
}

export function DemoBookingsPage(_: DemoPageProps) {
  return <DemoBookings mainSiteHref={resolvePrimarySiteUrl("/")} />
}
