import type { ComponentConfig } from "@measured/puck";

import { Banner2 } from "@/components/banner2";
import { siteContent } from "@/scripts/_reference/velvet/content";

export type Banner2BlockProps = {
  id?: string;
  title: string;
  description: string;
  linkText: string;
  linkUrl: string;
  defaultVisible?: boolean | "true" | "false";
};

export const banner2Config: ComponentConfig<Banner2BlockProps> = {
  fields: {
    title: { type: "text" },
    description: { type: "text" },
    linkText: { type: "text" },
    linkUrl: { type: "text" },
    defaultVisible: {
      type: "select",
      options: [
        { label: "Show", value: "true" },
        { label: "Hide", value: "false" },
      ],
    },
  },
  defaultProps: {
    title: siteContent.hero.reassurance[0] || "Reply within 1 business day",
    description: siteContent.hero.reassurance[1] || "Typical start in 2-3 weeks",
    linkText: siteContent.nav.cta,
    linkUrl: "#booking",
    defaultVisible: "true",
  },
  render: (props) => (
    <Banner2
      {...props}
      defaultVisible={
        props.defaultVisible === true || props.defaultVisible === "true"
      }
    />
  ),
};
