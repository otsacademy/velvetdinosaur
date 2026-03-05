import type { ComponentConfig } from "@measured/puck";

import { Hero01, type HeroMetaItem } from "@/components/hero-01";
import { siteContent } from "@/scripts/_reference/velvet/content";

export type Hero01BlockProps = {
  id?: string;
  eyebrow?: string;
  headline: string;
  subheadline?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  inputPlaceholder?: string;
  metaLine?: string;
  metaItems?: HeroMetaItem[];
  supportingTitle?: string;
  supportingText?: string;
  supportingLinkLabel?: string;
  supportingLinkHref?: string;
  imageSrc?: string;
  imageAlt?: string;
};

export const hero01Config: ComponentConfig<Hero01BlockProps> = {
  fields: {
    eyebrow: { type: "text" },
    headline: { type: "text" },
    subheadline: { type: "textarea" },
    primaryCtaLabel: { type: "text" },
    primaryCtaHref: { type: "text" },
    secondaryCtaLabel: { type: "text" },
    secondaryCtaHref: { type: "text" },
    inputPlaceholder: { type: "text" },
    metaLine: { type: "text" },
    metaItems: {
      type: "array",
      arrayFields: {
        label: { type: "text" },
      },
    },
    supportingTitle: { type: "text" },
    supportingText: { type: "textarea" },
    supportingLinkLabel: { type: "text" },
    supportingLinkHref: { type: "text" },
    imageSrc: { type: "text" },
    imageAlt: { type: "text" },
  },
  defaultProps: {
    eyebrow: siteContent.brand.tagline,
    headline: siteContent.hero.headline,
    subheadline: siteContent.hero.subheadline,
    primaryCtaLabel: siteContent.hero.primaryCta,
    primaryCtaHref: "#booking",
    secondaryCtaLabel: siteContent.hero.secondaryCta,
    secondaryCtaHref: "#pricing",
    inputPlaceholder: "",
    metaLine: siteContent.hero.qualifier,
    metaItems: siteContent.hero.reassurance.map((label: string) => ({ label })),
    supportingTitle: "",
    supportingText: siteContent.stickyCta.message,
    supportingLinkLabel: siteContent.nav.cta,
    supportingLinkHref: "#booking",
    imageSrc: siteContent.hero.image,
    imageAlt: siteContent.hero.imageAlt,
  },
  render: (props) => <Hero01 {...props} />,
};
