"use client"

import Link from "next/link"
import type { ComponentConfig } from "@measured/puck"

import { EditableImage, EditableText } from "@/components/demo/editable"
import { demoKey } from "@/components/demo/demo-helpers"
import { useDemoContent } from "@/components/demo/demo-context"

type FooterLink = {
  label: string
  href: string
}

export type FooterProps = {
  id?: string
  logoUrl: string
  logoAlt: string
  copyright: string
  location: string
  links: FooterLink[]
  adminLabel: string
}

export function Footer(props: FooterProps) {
  const key = (path: string) => demoKey(props.id, path)
  const currentYear = new Date().getFullYear()
  const { mode, openLogin } = useDemoContent()

  return (
    <footer className="py-16 md:py-20 bg-gradient-to-b from-background to-card border-t border-border/40">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid gap-10 md:grid-cols-[1fr_auto] items-start">
          {/* Brand section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="relative h-10 w-10">
                <EditableImage
                  demoKey={key("brand.logo")}
                  src={props.logoUrl}
                  alt={props.logoAlt}
                  width={40}
                  height={40}
                  className="w-10 h-10 object-contain"
                />
              </span>
              <span className="font-semibold text-lg text-foreground">
                <EditableText
                  demoKey={key("footer.copyright")}
                  value={props.copyright}
                  as="span"
                  showIcon={false}
                />
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              <EditableText
                demoKey={key("footer.location")}
                value={props.location}
                as="span"
                showIcon={false}
              />
            </p>
          </div>

          {/* Links section */}
          <nav className="flex flex-wrap gap-6 md:gap-8">
            {props.links.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-200"
              >
                <EditableText
                  demoKey={key(`footer.links.${index}.label`)}
                  value={link.label}
                  as="span"
                  showIcon={false}
                />
              </Link>
            ))}
            {mode === "demo" ? (
              <button
                type="button"
                onClick={openLogin}
                className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-200"
                aria-label={props.adminLabel}
              >
                <EditableText demoKey={key("footer.adminLabel")} value={props.adminLabel} as="span" showIcon={false} />
              </button>
            ) : null}
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-xs">
            © {currentYear} Velvet Dinosaur. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export const footerConfig: ComponentConfig<FooterProps> = {
  fields: {
    logoUrl: { type: "text" },
    logoAlt: { type: "text" },
    copyright: { type: "text" },
    location: { type: "text" },
    links: {
      type: "array",
      arrayFields: {
        label: { type: "text" },
        href: { type: "text" },
      },
    },
    adminLabel: { type: "text" },
  },
  defaultProps: {
    logoUrl: "",
    logoAlt: "",
    copyright: "",
    location: "",
    links: [],
    adminLabel: "",
  },
  render: (props) => <Footer {...props} />,
}
