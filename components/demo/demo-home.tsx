'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  FileText,
  FolderKanban,
  Images,
  LayoutGrid,
  MapPin,
  Palette,
  ShieldCheck,
  Star,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DemoWorkspaceShell } from '@/components/demo/demo-workspace-shell.client'
import { resolvePrimarySiteUrl } from '@/lib/demo-site'

const categories = [
  {
    icon: LayoutGrid,
    title: 'Visual Editor',
    description: 'Drag-and-drop page building with live preview',
  },
  {
    icon: FileText,
    title: 'Content Tools',
    description: 'Rich text editing, media management, and SEO controls',
  },
  {
    icon: MapPin,
    title: 'Travel Modules',
    description: 'Stays, routes, and booking integrations built-in',
  },
  {
    icon: Palette,
    title: 'Design System',
    description: 'Theme editor with typography and color controls',
  },
]

const stats = [
  { value: '12', label: 'Active modules' },
  { value: '100%', label: 'No-code friendly' },
  { value: '<2s', label: 'Avg. save time' },
  { value: '24/7', label: 'Auto-backup' },
]

const activity = [
  { icon: FolderKanban, title: 'Homepage draft created', time: 'Just now' },
  { icon: Images, title: '3 images uploaded to Media Library', time: '2 minutes ago' },
  { icon: Star, title: 'New review received (5 stars)', time: '5 minutes ago' },
]

export function DemoHome() {
  const [workspaceKey, setWorkspaceKey] = useState(0)
  const mainSiteHref = resolvePrimarySiteUrl('/')

  return (
    <DemoWorkspaceShell
      breadcrumbLabel="Overview"
      activeNav="overview"
      mainSiteHref={mainSiteHref}
      onResetDemo={() => {
        setWorkspaceKey((current) => current + 1)
        toast.success('The demo has been reset.')
      }}
    >
      <DemoHomeContent key={workspaceKey} />
    </DemoWorkspaceShell>
  )
}

function DemoHomeContent() {
  return (
    <div className="mx-auto w-full max-w-[36rem] space-y-4 md:space-y-5">
      {/* Welcome header */}
      <section className="space-y-2 pt-2 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--vd-fg)] md:text-[2rem]">
          Welcome to Sauro CMS
        </h2>
        <p className="mx-auto max-w-md text-sm leading-6 text-[var(--vd-muted-fg)] md:text-[0.95rem]">
          Explore the full workspace — page editor, content tools, travel modules, and design controls.
          Everything you need to manage your site, tailored for your workflow.
        </p>
      </section>

      {/* Start exploring CTA */}
      <section className="grid gap-4 rounded-[1.15rem] border border-[color-mix(in_oklch,var(--vd-primary)_18%,var(--vd-border))] bg-[color-mix(in_oklch,var(--vd-card)_94%,white)] p-4 shadow-[0_16px_34px_-30px_color-mix(in_oklch,var(--vd-primary)_22%,transparent)] md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="space-y-1">
          <p className="text-base font-semibold tracking-tight text-[var(--vd-fg)]">Start exploring</p>
          <p className="text-[13px] leading-5 text-[var(--vd-muted-fg)]">
            Start with the page editor to see how the CMS works, then use the sidebar to explore.
          </p>
        </div>
        <Button asChild className="vd-dino-cta h-10 shrink-0 rounded-xl px-4 text-sm font-medium">
          <Link href="/demo/new">
            Open the page editor
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </section>

      {/* Safe by default */}
      <section className="flex items-start gap-3 rounded-[1.15rem] border border-[color-mix(in_oklch,var(--vd-border)_78%,transparent)] bg-[color-mix(in_oklch,var(--vd-primary)_3%,var(--vd-card))] px-4 py-5">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--vd-primary)_10%,var(--vd-bg))]">
          <ShieldCheck className="h-4 w-4 text-[var(--vd-primary)]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--vd-fg)]">Safe by default</p>
          <p className="mt-0.5 text-[12px] leading-5 text-[var(--vd-muted-fg)]">
            No customer data, no persistent writes, no real permissions. Everything resets when you leave.
          </p>
        </div>
      </section>

      {/* Category cards */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {categories.map((cat) => {
          const Icon = cat.icon
          return (
            <div
              key={cat.title}
              className="rounded-[1.05rem] border border-[color-mix(in_oklch,var(--vd-border)_78%,transparent)] bg-[color-mix(in_oklch,var(--vd-card)_96%,white)] p-4 shadow-[0_10px_24px_-24px_color-mix(in_oklch,var(--vd-fg)_26%,transparent)]"
            >
              <div className="mb-5 flex h-8 w-8 items-center justify-center rounded-lg bg-[color-mix(in_oklch,var(--vd-primary)_10%,var(--vd-bg))] text-[var(--vd-primary)]">
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-[13px] font-semibold leading-5 text-[var(--vd-fg)]">{cat.title}</p>
              <p className="mt-1 text-[11px] leading-4 text-[var(--vd-muted-fg)]">{cat.description}</p>
            </div>
          )
        })}
      </section>

      {/* Stats row */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-[1.05rem] border border-[color-mix(in_oklch,var(--vd-border)_78%,transparent)] bg-[color-mix(in_oklch,var(--vd-card)_96%,white)] p-4 text-center shadow-[0_10px_24px_-24px_color-mix(in_oklch,var(--vd-fg)_24%,transparent)]"
          >
            <p className="text-[1.35rem] font-semibold tracking-tight text-[var(--vd-primary)]">{stat.value}</p>
            <p className="mt-1 text-[11px] leading-4 text-[var(--vd-muted-fg)]">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Recent activity */}
      <section className="rounded-[1.15rem] border border-[color-mix(in_oklch,var(--vd-border)_78%,transparent)] bg-[color-mix(in_oklch,var(--vd-card)_96%,white)] p-4 shadow-[0_14px_32px_-28px_color-mix(in_oklch,var(--vd-fg)_26%,transparent)]">
        <p className="text-base font-semibold tracking-tight text-[var(--vd-fg)]">Recent demo activity</p>
        <p className="mt-1 text-[12px] leading-5 text-[var(--vd-muted-fg)]">Sample activity from this sandbox session</p>
        <div className="mt-4 space-y-2">
          {activity.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="flex items-center gap-3 rounded-lg bg-[color-mix(in_oklch,var(--vd-muted)_68%,white)] px-3 py-2.5"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--vd-muted-fg)]" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium leading-5 text-[var(--vd-fg)]">{item.title}</p>
                  <p className="text-[10px] leading-4 text-[var(--vd-muted-fg)]">{item.time}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
