"use client"

import type { ComponentConfig } from "@measured/puck"
import {
  BadgeCheck,
  DatabaseBackup,
  MapPin,
  Star,
  Target,
  Unlock,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { formatNumber } from "@/lib/format"
import { ShadcnblocksContainer } from "@/components/blocks/store/shadcnblocks/shared"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

type FeatureIcon = "MapPin" | "Target" | "NHS" | "DatabaseBackup" | "Unlock"

type FeatureItem = {
  icon: FeatureIcon
  text: string
}

export type ShadcnblocksTrustStrip4Props = {
  rating: number
  reviewCount: number
  reviewLabel: string
  features: FeatureItem[]
  badgeLabel: string
}

const NHSLogo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 192.756 192.756"
    className={className}
    aria-hidden="true"
  >
    <g fillRule="evenodd" clipRule="evenodd">
      <path fill="#1879bf" d="M184.252 131.945V60.811H8.504v71.134h175.748z" />
      <path
        fill="#fff"
        d="M25.69 67.673h19.103l11.734 39.706h.162l8.038-39.706h14.439l-12.133 57.259H47.994l-11.971-39.62h-.162l-7.962 39.62H13.46l12.23-57.259zM84.822 67.673h15.332l-4.503 21.906h18.122l4.516-21.906h15.332l-11.894 57.259h-15.332l5.084-24.524H93.345l-5.085 24.524H72.926l11.896-57.259zM173.975 80.636c-2.953-1.39-6.973-2.618-12.629-2.618-6.066 0-10.99.895-10.99 5.495 0 8.113 22.229 5.085 22.229 22.477 0 15.828-14.688 19.932-27.973 19.932-5.904 0-12.715-1.4-17.713-2.963l3.609-11.646c3.027 1.973 9.104 3.285 14.104 3.285 4.764 0 12.219-.904 12.219-6.809 0-9.191-22.229-5.744-22.229-21.895 0-14.772 12.963-19.201 25.516-19.201 7.057 0 13.695.743 17.553 2.542l-3.696 11.401z"
      />
    </g>
  </svg>
)

const ICON_MAP: Record<FeatureIcon, React.ElementType> = {
  MapPin,
  Target,
  NHS: NHSLogo,
  DatabaseBackup,
  Unlock,
}

export function ShadcnblocksTrustStrip4(props: ShadcnblocksTrustStrip4Props) {
  const rating = typeof props.rating === "number" ? props.rating : 0
  const reviewCount = typeof props.reviewCount === "number" ? props.reviewCount : 0
  const reviewLabel = props.reviewLabel || "reviews"
  const badgeLabel = props.badgeLabel || ""
  const features = props.features || []

  return (
    <ShadcnblocksContainer>
      <section className="bg-muted/50 py-8">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "size-4",
                        i < Math.floor(rating)
                          ? "fill-primary text-primary"
                          : "fill-muted text-muted",
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold">{rating}</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-sm text-muted-foreground">
                {formatNumber(reviewCount)}+ {reviewLabel}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
              {features.map((feature, index) => {
                const Icon = ICON_MAP[feature.icon] || BadgeCheck
                return (
                  <div
                    key={`${feature.text}-${index}`}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground"
                  >
                    <Icon className="size-4 text-primary" />
                    <span>{feature.text}</span>
                  </div>
                )
              })}
            </div>

            <Badge variant="secondary" className="gap-1.5">
              <BadgeCheck className="size-3.5 text-primary" />
              {badgeLabel}
            </Badge>
          </div>
        </div>
      </section>
    </ShadcnblocksContainer>
  )
}

export const shadcnblocksTrustStrip4Config: ComponentConfig<ShadcnblocksTrustStrip4Props> = {
  fields: {
    rating: { type: "number" },
    reviewCount: { type: "number" },
    reviewLabel: { type: "text" },
    features: {
      type: "array",
      arrayFields: {
        icon: {
          type: "select",
          options: [
            { label: "MapPin", value: "MapPin" },
            { label: "Target", value: "Target" },
            { label: "NHS", value: "NHS" },
            { label: "DatabaseBackup", value: "DatabaseBackup" },
            { label: "Unlock", value: "Unlock" },
          ],
        },
        text: { type: "text" },
      },
    },
    badgeLabel: { type: "text" },
  },
  defaultProps: {
    rating: 4.8,
    reviewCount: 25000,
    reviewLabel: "verified reviews",
    badgeLabel: "Verified Seller",
    features: [
      { icon: "MapPin", text: "Based in the UK" },
      { icon: "Target", text: "Fixed scope" },
      { icon: "NHS", text: "NHS grade rigour" },
      { icon: "DatabaseBackup", text: "Daily backups" },
      { icon: "Unlock", text: "No lock in" },
      { icon: "MapPin", text: "Bare metal hosting" },
    ],
  },
  render: (props) => <ShadcnblocksTrustStrip4 {...props} />,
}
