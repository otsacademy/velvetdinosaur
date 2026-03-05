import type { ComponentConfig } from "@measured/puck";

import { Pricing2 } from "@/components/pricing2";
import { siteContent } from "@/scripts/_reference/velvet/content";

export type Pricing2BlockProps = {
  id?: string;
  heading?: string;
  description?: string;
  baselineLabel?: string;
  baselinePrice?: string;
  baselineItems?: string[];
  includesTitle?: string;
  includes?: string[];
  hostingTitle?: string;
  hostingDetails?: string[];
  factorsTitle?: string;
  factors?: string[];
  note?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
};

export const pricing2Config: ComponentConfig<Pricing2BlockProps> = {
  fields: {
    heading: { type: "text" },
    description: { type: "textarea" },
    baselineLabel: { type: "text" },
    baselinePrice: { type: "text" },
    baselineItems: {
      type: "array",
      arrayFields: {
        value: { type: "text" },
      },
    },
    includesTitle: { type: "text" },
    includes: {
      type: "array",
      arrayFields: {
        value: { type: "text" },
      },
    },
    hostingTitle: { type: "text" },
    hostingDetails: {
      type: "array",
      arrayFields: {
        value: { type: "text" },
      },
    },
    factorsTitle: { type: "text" },
    factors: {
      type: "array",
      arrayFields: {
        value: { type: "text" },
      },
    },
    note: { type: "textarea" },
    primaryCtaLabel: { type: "text" },
    primaryCtaHref: { type: "text" },
    secondaryCtaLabel: { type: "text" },
    secondaryCtaHref: { type: "text" },
  },
  defaultProps: {
    heading: siteContent.pricing.heading,
    description: siteContent.pricing.subheading,
    baselineLabel: siteContent.pricing.baseline.label,
    baselinePrice: siteContent.pricing.baseline.price,
    baselineItems: [
      siteContent.pricing.baseline.includesSummary,
      siteContent.pricing.baseline.includesNote,
      ...siteContent.pricing.inclusions,
    ],
    includesTitle: siteContent.pricing.includesHeading,
    includes: [...siteContent.pricing.clarifiers[1].bullets, siteContent.pricing.vatNote],
    hostingTitle: siteContent.pricing.hostingHeading,
    hostingDetails: [...siteContent.pricing.hostingItems],
    factorsTitle: siteContent.pricing.clarifiers[0].heading,
    factors: [...siteContent.pricing.clarifiers[0].bullets],
    note: siteContent.pricing.complexityNote,
    primaryCtaLabel: siteContent.pricing.ctas.primary.label,
    primaryCtaHref: siteContent.pricing.ctas.primary.href,
    secondaryCtaLabel: siteContent.pricing.ctas.secondary.label,
    secondaryCtaHref: siteContent.pricing.ctas.secondary.href,
  },
  render: (props) => <Pricing2 {...props} />,
};
