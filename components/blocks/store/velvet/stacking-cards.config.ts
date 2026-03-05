import type { ComponentConfig } from "@measured/puck"

import { StackingCardsSection, type StackingCardsProps } from "@/components/blocks/store/velvet/stacking-cards"

export const stackingCardsConfig: ComponentConfig<StackingCardsProps> = {
  fields: {
    heading: { type: "text" },
    subheading: { type: "textarea" },
    detailLabels: {
      type: "object",
      objectFields: {
        problem: { type: "text" },
        build: { type: "text" },
        result: { type: "text" },
      },
    },
    ctaTooltipLabel: { type: "text" },
    portfolioStackLabel: { type: "text" },
    portfolioMagazineLabel: { type: "text" },
    portfolioStackAriaLabel: { type: "text" },
    portfolioMagazineAriaLabel: { type: "text" },
    cards: {
      type: "array",
      arrayFields: {
        eyebrow: { type: "text" },
        title: { type: "text" },
        description: { type: "textarea" },
        problem: { type: "textarea" },
        build: { type: "textarea" },
        result: { type: "textarea" },
        icon: {
          type: "select",
          options: [
            { label: "Education", value: "education" },
            { label: "Tours", value: "tours" },
            { label: "Personal", value: "personal" },
            { label: "Journal", value: "journal" },
          ],
        },
        metrics: {
          type: "array",
          arrayFields: {
            label: { type: "text" },
            value: { type: "text" },
          },
        },
        cta: {
          type: "object",
          objectFields: {
            label: { type: "text" },
            href: { type: "text" },
          },
        },
        images: {
          type: "array",
          arrayFields: {
            value: { type: "text" },
          },
        },
      },
    },
  },
  defaultProps: {
    heading: "",
    subheading: "",
    detailLabels: {
      problem: "",
      build: "",
      result: "",
    },
    ctaTooltipLabel: "",
    portfolioStackLabel: "",
    portfolioMagazineLabel: "",
    portfolioStackAriaLabel: "",
    portfolioMagazineAriaLabel: "",
    cards: [],
  },
  render: (props) => StackingCardsSection(props) as any,
}
