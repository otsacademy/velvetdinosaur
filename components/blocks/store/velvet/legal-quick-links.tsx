"use client"

import type { ComponentConfig } from "@measured/puck"

import { EditableText } from "@/components/demo/editable"
import { demoKey } from "@/components/demo/demo-helpers"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getLegalIcon } from "@/components/blocks/store/velvet/shared/legal-helpers"

type QuickLink = {
  label: string
  href: string
}

export type LegalQuickLinksProps = {
  id?: string
  heading: string
  icon: string
  links: QuickLink[]
}

export function LegalQuickLinks(props: LegalQuickLinksProps) {
  const key = (path: string) => demoKey(props.id, path)
  const Icon = getLegalIcon(props.icon)

  return (
    <Card className="mt-8 rounded-2xl border bg-muted/30">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          {Icon ? <Icon className="h-4 w-4 text-primary" /> : null}
          <h2 className="text-lg font-semibold text-foreground">
            <EditableText demoKey={key("legal.quickLinks.heading")} value={props.heading} as="span" showIcon={false} />
          </h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {props.links.map((link, index) => (
            <Button key={link.href} variant="outline" size="sm" className="justify-start" asChild>
              <a href={link.href}>
                <EditableText
                  demoKey={key(`legal.quickLinks.links.${index}.label`)}
                  value={link.label}
                  as="span"
                  showIcon={false}
                />
              </a>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export const legalQuickLinksConfig: ComponentConfig<LegalQuickLinksProps> = {
  fields: {
    heading: { type: "text" },
    icon: { type: "text" },
    links: {
      type: "array",
      arrayFields: {
        label: { type: "text" },
        href: { type: "text" },
      },
    },
  },
  defaultProps: {
    heading: "",
    icon: "",
    links: [],
  },
  render: (props) => <LegalQuickLinks {...props} />,
}
