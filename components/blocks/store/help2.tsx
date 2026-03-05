import type { ComponentConfig } from "@measured/puck";

import { Help2 } from "@/components/help2";
import { siteContent } from "@/scripts/_reference/velvet/content";

type FaqItem = {
  question: string;
  answer: string;
  category: string;
};

const CATEGORY_BY_QUESTION: Record<string, string> = {
  "How much does a website cost?": "Pricing",
  "What platform or CMS do you use?": "Tech",
  "How long does a typical project take?": "Process",
  "What are the payment terms?": "Pricing",
  "What is your refund/cancellation policy?": "Pricing",
  "What are the ongoing costs after launch?": "Pricing",
  "What's included in support — and what isn't?": "Support",
  "How many revisions are included?": "Process",
  "What if I need changes after launch?": "Support",
  "Will my site be accessible and mobile-friendly?": "Tech",
  "Can you migrate my existing site/content?": "Logistics",
  "Do you do ecommerce, bookings, or other integrations?": "Tech",
  "What do you need from me, and when?": "Process",
  "Do you provide training or handover for editing the site?": "Support",
  "Can I see how editing works?": "Support",
  "Do you work with clients outside Oxford?": "Logistics",
  "Can you work with my existing hosting?": "Logistics",
  "What makes you different from agencies?": "Process",
};

export type Help2BlockProps = {
  id?: string;
  title?: string;
  description?: string;
  faqs?: FaqItem[];
  searchPlaceholder?: string;
  emptyMessage?: string;
  contactHeading?: string;
  contactDescription?: string;
  contactButtons?: {
    label: string;
    href: string;
    icon?: "MessageSquare" | "Mail" | "Phone";
  }[];
};

export const help2Config: ComponentConfig<Help2BlockProps> = {
  fields: {
    title: { type: "text" },
    description: { type: "textarea" },
    searchPlaceholder: { type: "text" },
    emptyMessage: { type: "text" },
    contactHeading: { type: "text" },
    contactDescription: { type: "text" },
    contactButtons: {
      type: "array",
      arrayFields: {
        label: { type: "text" },
        href: { type: "text" },
        icon: {
          type: "select",
          options: [
            { label: "MessageSquare", value: "MessageSquare" },
            { label: "Mail", value: "Mail" },
            { label: "Phone", value: "Phone" },
          ],
        },
      },
    },
    faqs: {
      type: "array",
      arrayFields: {
        question: { type: "text" },
        answer: { type: "textarea" },
        category: { type: "text" },
      },
    },
  },
  defaultProps: {
    title: siteContent.faq.heading,
    description: siteContent.faq.subheading,
    searchPlaceholder: "Search questions…",
    emptyMessage: "No questions match your filters.",
    contactHeading: "Still unsure?",
    contactDescription: siteContent.booking.trustLine,
    contactButtons: [
      { label: "Book a call", href: "#booking", icon: "Phone" },
      { label: "Email us", href: "mailto:hello@velvetdinosaur.com", icon: "Mail" },
    ],
    faqs: siteContent.faq.items.map((item: { question: string; answer: string }) => ({
      question: item.question,
      answer: item.answer,
      category: CATEGORY_BY_QUESTION[item.question] ?? "Process",
    })),
  },
  render: (props) => <Help2 {...props} />,
};
