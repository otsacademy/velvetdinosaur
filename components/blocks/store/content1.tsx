import type { ComponentConfig } from "@measured/puck";

import { Content1, type ContentSection } from "@/components/content1";
import { siteContent } from "@/scripts/_reference/velvet/content";

export type Content1BlockProps = {
  id?: string;
  badgeLabel?: string;
  title?: string;
  description?: string;
  heroImage?: string;
  sections?: ContentSection[];
};

export const content1Config: ComponentConfig<Content1BlockProps> = {
  fields: {
    badgeLabel: { type: "text" },
    title: { type: "text" },
    description: { type: "textarea" },
    heroImage: { type: "text" },
    sections: {
      type: "array",
      arrayFields: {
        id: { type: "text" },
        title: { type: "text" },
        body: { type: "textarea" },
      },
    },
  },
  defaultProps: {
    badgeLabel: siteContent.brand.name,
    title: "",
    description: "",
    heroImage: "",
    sections: [],
  },
  render: (props) => <Content1 {...props} />,
};
