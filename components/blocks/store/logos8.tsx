import type { ComponentConfig } from "@measured/puck";

import { Logos8 } from "@/components/logos8";
import { siteContent } from "@/scripts/_reference/velvet/content";

type LogoItem = {
  name: string;
  logo: string;
  className: string;
};

export type Logos8BlockProps = {
  id?: string;
  title?: string;
  subtitle?: string;
  logos?: LogoItem[];
};

export const logos8Config: ComponentConfig<Logos8BlockProps> = {
  fields: {
    title: { type: "text" },
    subtitle: { type: "text" },
    logos: {
      type: "array",
      arrayFields: {
        name: { type: "text" },
        logo: { type: "text" },
        className: { type: "text" },
      },
    },
  },
  defaultProps: {
    title: "Trusted by",
    subtitle: siteContent.brand.tagline,
    logos: siteContent.trustedBy.items.map((item: { name: string; logo?: string; logoClassName?: string }) => ({
      name: item.name,
      logo: item.logo,
      className: (item as { logoClassName?: string }).logoClassName || "h-8 w-auto",
    })),
  },
  render: (props) => <Logos8 {...props} />,
};
