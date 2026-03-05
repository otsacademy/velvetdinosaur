import type { ComponentConfig } from "@measured/puck";

import { Process3, type ProcessStep } from "@/components/process3";
import { siteContent } from "@/scripts/_reference/velvet/content";

export type Process3BlockProps = {
  id?: string;
  eyebrow?: string;
  heading?: string;
  description?: string;
  note?: string;
  steps?: ProcessStep[];
};

export const process3Config: ComponentConfig<Process3BlockProps> = {
  fields: {
    eyebrow: { type: "text" },
    heading: { type: "text" },
    description: { type: "textarea" },
    note: { type: "text" },
    steps: {
      type: "array",
      arrayFields: {
        title: { type: "text" },
        description: { type: "textarea" },
      },
    },
  },
  defaultProps: {
    eyebrow: siteContent.process.eyebrow,
    heading: siteContent.process.heading,
    description: siteContent.process.subheading,
    note: siteContent.process.note,
    steps: siteContent.process.steps.map((step: { title: string; summary?: string }) => ({
      title: step.title,
      description: step.summary,
    })),
  },
  render: ({ puck, ...props }) => {
    void puck
    return <Process3 {...props} />
  },
};
