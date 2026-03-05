import type { ComponentConfig } from "@measured/puck";

import { Services21, type ServiceItem } from "@/components/services21";
import { assetUrl } from "@/lib/assets";
import { siteContent } from "@/scripts/_reference/velvet/content";

const SERVICE_IMAGES = [
  assetUrl("modern-dashboard-analytics.jpg"),
  assetUrl("modern-ecommerce-website.png"),
  assetUrl("mobile-banking-app.png"),
  assetUrl("brand-identity-design-mockup.jpg"),
  assetUrl("modern-dashboard-analytics.jpg"),
  assetUrl("modern-ecommerce-website.png"),
];

export type Services21BlockProps = {
  id?: string;
  heading?: string;
  intro?: string;
  services?: ServiceItem[];
  ctaLabel?: string;
  ctaHref?: string;
};

export const services21Config: ComponentConfig<Services21BlockProps> = {
  fields: {
    heading: { type: "text" },
    intro: { type: "textarea" },
    services: {
      type: "array",
      arrayFields: {
        id: { type: "text" },
        title: { type: "text" },
        image: { type: "text" },
        description: { type: "textarea" },
        meta: { type: "text" },
      },
    },
    ctaLabel: { type: "text" },
    ctaHref: { type: "text" },
  },
  defaultProps: {
    heading: siteContent.services.heading,
    intro: siteContent.brand.tagline,
    services: siteContent.services.items.map(
      (item: { title: string; body?: string; builtWith?: string }, index: number) => ({
        id: `{${String(index + 1).padStart(2, "0")}}`,
        title: item.title,
        image: SERVICE_IMAGES[index % SERVICE_IMAGES.length],
        description: item.body,
        meta: item.builtWith,
      })
    ),
    ctaLabel: siteContent.nav.cta,
    ctaHref: "#booking",
  },
  render: (props) => <Services21 {...props} />,
};
