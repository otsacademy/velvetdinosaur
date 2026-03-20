"use client"

import { BadgeCheck, DatabaseBackup, MapPin, Target, Unlock } from "lucide-react"

import { EditableText } from "@/components/content/editable"
import { contentKey } from "@/components/content/content-keys"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const NHSLogo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 192.756 192.756"
    className={`${className ?? ""} h-5 w-auto`}
    aria-hidden
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

const iconMap: Record<string, React.ElementType> = {
  "Oxford, UK": MapPin,
  "Fixed scope": Target,
  "NHS Grade Rigour": NHSLogo,
  "Daily backups": DatabaseBackup,
  "No lock-in": Unlock,
}

type StringItem = string | { value?: string }

type TrustStripProps = {
  contentId?: string
  items: StringItem[]
  showVerifiedBadge?: boolean | "true" | "false"
  verifiedLabel?: string
}

export function TrustStrip({ contentId, items, showVerifiedBadge = true, verifiedLabel = "" }: TrustStripProps) {
  const normalizedItems = (items || [])
    .map((item) => (typeof item === "string" ? item : item?.value))
    .filter((item): item is string => Boolean(item))
  const shouldShowBadge = showVerifiedBadge !== false && showVerifiedBadge !== "false" && Boolean(verifiedLabel)

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-center gap-y-2 rounded-full border border-border/60 bg-card/70 px-4 py-2 shadow-sm backdrop-blur">
        {normalizedItems.map((item, index) => {
          const Icon = iconMap[item] || BadgeCheck

          return (
            <div key={`${item}-${index}`} className="flex items-center text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <EditableText
                  contentKey={contentKey(contentId, `trustStrip.items.${index}`)}
                  value={item}
                  as="span"
                  className="font-medium text-foreground/80"
                  showIcon={false}
                />
              </span>
              {index < normalizedItems.length - 1 && (
                <Separator orientation="vertical" className="mx-3 h-4" />
              )}
            </div>
          )
        })}
        {shouldShowBadge ? (
          <div className="flex items-center">
            <Separator orientation="vertical" className="mx-3 h-4" />
            <Badge variant="secondary" className="text-xs font-semibold">
              <EditableText
                contentKey={contentKey(contentId, "trustStrip.verifiedLabel")}
                value={verifiedLabel}
                as="span"
                showIcon={false}
              />
            </Badge>
          </div>
        ) : null}
      </div>
    </div>
  )
}
