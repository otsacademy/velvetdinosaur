import type { ComponentConfig } from "@measured/puck";

import { Feature17, type FeatureIconName } from "@/components/feature17";
import { siteContent } from "@/scripts/_reference/velvet/content";

type FeatureItem = {
  heading: string;
  description: string;
  iconName?: FeatureIconName;
};

export type Feature17BlockProps = {
  id?: string;
  label?: string;
  title?: string;
  features?: FeatureItem[];
  buttonText?: string;
  buttonUrl?: string;
};

export const feature17Config: ComponentConfig<Feature17BlockProps> = {
  fields: {
    label: { type: "text" },
    title: { type: "text" },
    features: {
      type: "array",
      arrayFields: {
        heading: { type: "text" },
        description: { type: "textarea" },
        iconName: { type: "text" },
      },
    },
    buttonText: { type: "text" },
    buttonUrl: { type: "text" },
  },
  defaultProps: {
    label: siteContent.whyVd.heading,
    title: siteContent.whyVd.subheading,
    features: siteContent.whyVd.badges.map((badge: { label: string; description: string; icon?: string }) => ({
      heading: badge.label,
      description: badge.description,
      iconName: badge.icon as FeatureIconName,
    })),
    buttonText: "",
    buttonUrl: "",
  },
  render: (props) => <Feature17 {...props} />,
};
