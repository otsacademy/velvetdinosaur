"use client"

import type { ComponentConfig } from "@measured/puck"
import {
  Award,
  BadgeCheck,
  Clock,
  DatabaseBackup,
  Fingerprint,
  HeartHandshake,
  Palette,
  Shield,
  Target,
  Unlock,
  User,
  Zap,
} from "lucide-react"

import { EditableText } from "@/components/demo/editable"
import { demoKey } from "@/components/demo/demo-helpers"
import { Badge } from "@/components/ui/badge"
import { Section, SectionHeading } from "@/components/ui/section"
import { AnimatedSection } from "@/components/ui/animated-section"

const iconMap: Record<string, React.ElementType> = {
  User,
  Shield,
  Target,
  Clock,
  Unlock,
  Award,
  DatabaseBackup,
  HeartHandshake,
  Palette,
  Zap,
  BadgeCheck,
  Fingerprint,
}

const defaultIconKeys = [
  "User",
  "Shield",
  "Target",
  "Clock",
  "Unlock",
  "Award",
  "DatabaseBackup",
]

type FeatureBadge = {
  label: string
  description?: string
  icon: string
}

export type FeatureBadgeGridProps = {
  id?: string
  heading: string
  subheading?: string
  badges: FeatureBadge[]
}

export function FeatureBadgeGrid(props: FeatureBadgeGridProps) {
  const key = (path: string) => demoKey(props.id, path)
  const badges = props.badges || []

  return (
    <Section id="why" className="bg-muted/30" animate divider>
      <SectionHeading displayFont>
        <span className="inline-flex items-center justify-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 md:h-9 md:w-9 text-muted-foreground"
            aria-hidden
          >
            <path d="M12 2 2 7l10 5 10-5-10-5Z" />
            <path d="m2 17 10 5 10-5" />
            <path d="m2 12 10 5 10-5" />
          </svg>
          <EditableText
            demoKey={key("featureBadges.heading")}
            value={props.heading}
            as="span"
            showIcon={false}
          />
        </span>
      </SectionHeading>
      {props.subheading ? (
        <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
          <EditableText
            demoKey={key("featureBadges.subheading")}
            value={props.subheading}
            as="span"
            multiline
            showIcon={false}
          />
        </p>
      ) : null}
      <AnimatedSection animation="fade-up" staggerChildren staggerDelay={60} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {badges.map((badge, index) => {
          const iconKey = badge.icon || defaultIconKeys[index] || "BadgeCheck"
          const Icon = iconMap[iconKey] || BadgeCheck

          return (
            <div
              key={index}
              className="group flex items-start gap-4 rounded-xl border border-border/60 bg-background p-4 transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 hover:-translate-y-0.5"
            >
              <div className="icon-badge shrink-0">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="font-medium text-foreground">
                  <EditableText
                    demoKey={key(`featureBadges.badges.${index}.label`)}
                    value={badge.label}
                    as="span"
                    showIcon={false}
                  />
                </p>
                {badge.description ? (
                  <p className="text-sm text-muted-foreground">
                    <EditableText
                      demoKey={key(`featureBadges.badges.${index}.description`)}
                      value={badge.description}
                      as="span"
                      multiline
                      showIcon={false}
                    />
                  </p>
                ) : null}
              </div>
            </div>
          )
        })}
      </AnimatedSection>
    </Section>
  )
}

export const featureBadgeGridConfig: ComponentConfig<FeatureBadgeGridProps> = {
  fields: {
    heading: { type: "text" },
    subheading: { type: "textarea" },
    badges: {
      type: "array",
      arrayFields: {
        label: { type: "text" },
        description: { type: "textarea" },
        icon: {
          type: "select",
          options: [
            { label: "User (Founder-led)", value: "User" },
            { label: "Shield (NHS-grade)", value: "Shield" },
            { label: "Target (Fixed scope)", value: "Target" },
            { label: "Clock (Fast delivery)", value: "Clock" },
            { label: "Unlock (No lock-in)", value: "Unlock" },
            { label: "Award (Quality)", value: "Award" },
            { label: "Database (Backups)", value: "DatabaseBackup" },
            { label: "Handshake (Partnership)", value: "HeartHandshake" },
            { label: "Palette (Design)", value: "Palette" },
            { label: "Zap (Performance)", value: "Zap" },
            { label: "Check (Verified)", value: "BadgeCheck" },
            { label: "Fingerprint (Unique)", value: "Fingerprint" },
          ],
        },
      },
    },
  },
  defaultProps: {
    heading: "",
    subheading: "",
    badges: [],
  },
  render: (props) => <FeatureBadgeGrid {...props} />,
}
