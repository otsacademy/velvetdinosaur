import type { ComponentConfig } from "@measured/puck";

import {
  TestimonialsSimple01,
  type TestimonialsSimpleItem,
} from "@/components/testimonials-simple-01";
import { siteContent } from "@/scripts/_reference/velvet/content";

export type TestimonialsSimple01BlockProps = {
  id?: string;
  eyebrow?: string;
  heading?: string;
  description?: string;
  items?: TestimonialsSimpleItem[];
};

const heroProofItems: TestimonialsSimpleItem[] = siteContent.hero.proof.items.map(
  (item: { quote: string; name?: string; role?: string; org?: string; outcome?: string }) => ({
  quote: item.quote,
  name: item.name,
  role: item.role,
  company: item.org,
  outcome: item.outcome,
  })
);

const testimonialItems: TestimonialsSimpleItem[] = siteContent.testimonials.items.map(
  (item: { quote: string; name?: string; roleOrContext?: string; org?: string; outcome?: string }) => ({
  quote: item.quote,
  name: item.name,
  role: item.roleOrContext,
  company: item.org,
  outcome: item.outcome,
  })
);

export const testimonialsSimple01Config: ComponentConfig<TestimonialsSimple01BlockProps> = {
  fields: {
    eyebrow: { type: "text" },
    heading: { type: "text" },
    description: { type: "textarea" },
    items: {
      type: "array",
      arrayFields: {
        quote: { type: "textarea" },
        name: { type: "text" },
        role: { type: "text" },
        company: { type: "text" },
        outcome: { type: "text" },
        image: { type: "text" },
      },
    },
  },
  defaultProps: {
    eyebrow: siteContent.testimonials.heading,
    heading: siteContent.hero.proof.heading,
    description: "",
    items: [...heroProofItems, ...testimonialItems],
  },
  render: (props) => <TestimonialsSimple01 {...props} />,
};
