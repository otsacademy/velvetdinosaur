import type { ComponentConfig } from "@measured/puck";

import { CaseStudies3, type CaseStudyCard } from "@/components/case-studies3";
import { siteContent } from "@/scripts/_reference/velvet/content";

export type CaseStudies3BlockProps = {
  id?: string;
  heading?: string;
  description?: string;
  featured?: CaseStudyCard;
  items?: CaseStudyCard[];
  linkLabel?: string;
};

function mapCaseStudy(card: (typeof siteContent.caseStudies.cards)[number]): CaseStudyCard {
  return {
    title: card.title,
    client: card.eyebrow,
    summary: card.description,
    outcome: card.result,
    image: card.images?.[0],
    link: card.cta?.href,
    tags: (card.metrics || []).map((metric: { label: string; value: string }) => `${metric.label}: ${metric.value}`),
  };
}

const caseStudies = siteContent.caseStudies.cards.map(mapCaseStudy);
const featured = caseStudies[0];
const items = caseStudies.slice(1);

export const caseStudies3Config: ComponentConfig<CaseStudies3BlockProps> = {
  fields: {
    heading: { type: "text" },
    description: { type: "text" },
    featured: {
      type: "object",
      objectFields: {
        title: { type: "text" },
        client: { type: "text" },
        summary: { type: "text" },
        outcome: { type: "text" },
        image: { type: "text" },
        logo: { type: "text" },
        link: { type: "text" },
        tags: {
          type: "array",
          arrayFields: {
            value: { type: "text" },
          },
        },
      },
    },
    items: {
      type: "array",
      arrayFields: {
        title: { type: "text" },
        client: { type: "text" },
        summary: { type: "text" },
        outcome: { type: "text" },
        image: { type: "text" },
        logo: { type: "text" },
        link: { type: "text" },
        tags: {
          type: "array",
          arrayFields: {
            value: { type: "text" },
          },
        },
      },
    },
    linkLabel: { type: "text" },
  },
  defaultProps: {
    heading: siteContent.caseStudies.heading,
    description: siteContent.caseStudies.subheading,
    featured,
    items,
    linkLabel: siteContent.caseStudies.cards[0]?.cta?.label || "View build",
  },
  render: (props) => <CaseStudies3 {...props} />,
};
