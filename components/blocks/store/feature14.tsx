import type { ComponentConfig } from "@measured/puck";

import { Feature14, type Feature14Item } from "@/components/feature14";
import { assetUrl } from "@/lib/assets";
import { siteContent } from "@/scripts/_reference/velvet/content";

export type Feature14BlockProps = {
  id?: string;
  heading?: string;
  description?: string;
  items?: Feature14Item[];
};

const editableItems = siteContent.editing.editableItems;

export const feature14Config: ComponentConfig<Feature14BlockProps> = {
  fields: {
    heading: { type: "text" },
    description: { type: "textarea" },
    items: {
      type: "array",
      arrayFields: {
        title: { type: "text" },
        description: { type: "textarea" },
        bullets: {
          type: "array",
          arrayFields: {
            value: { type: "text" },
          },
        },
        image: { type: "text" },
        imageAlt: { type: "text" },
        badge: { type: "text" },
        ctaLabel: { type: "text" },
        ctaHref: { type: "text" },
      },
    },
  },
  defaultProps: {
    heading: siteContent.editing.heading,
    description: siteContent.editing.subheading,
    items: [
      {
        title: "What you can edit",
        description: editableItems[0] || "",
        bullets: editableItems.slice(1),
        image: assetUrl("modern-dashboard-analytics.jpg"),
        imageAlt: "Editable content overview",
        badge: "01",
      },
      {
        title: siteContent.editing.safetyNet.title,
        description: siteContent.editing.safetyNet.description,
        bullets: [],
        image: assetUrl("modern-ecommerce-website.png"),
        imageAlt: "Backup overview",
        badge: "02",
      },
      {
        title: "Log in to the demo",
        description:
          "Step into a sandboxed version of the site and try editing for yourself. Use any demo credentials to sign in; refresh to reset everything.",
        bullets: [
          "Open the demo environment",
          "Sign in with any demo credentials",
          "Changes reset on refresh",
        ],
        image: assetUrl("placeholder.jpg"),
        imageAlt: "Demo login preview",
        badge: "03",
        ctaLabel: "Open demo & sign in",
        ctaHref: "/demo?admin=1",
      },
    ],
  },
  render: (props) => <Feature14 {...props} />,
};
