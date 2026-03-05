import type { ComponentConfig } from "@measured/puck";

import { Contact2 } from "@/components/contact2";
import { siteContent } from "@/scripts/_reference/velvet/content";

type ContactDetail = {
  label: string;
  value: string;
  href?: string;
};

export type Contact2BlockProps = {
  id?: string;
  title?: string;
  description?: string;
  details?: ContactDetail[];
  formTitle?: string;
  formDescription?: string;
  submitLabel?: string;
  privacyLabel?: string;
  privacyLinkLabel?: string;
  privacyHref?: string;
  optionalLabel?: string;
};

export const contact2Config: ComponentConfig<Contact2BlockProps> = {
  fields: {
    title: { type: "text" },
    description: { type: "text" },
    details: {
      type: "array",
      arrayFields: {
        label: { type: "text" },
        value: { type: "text" },
        href: { type: "text" },
      },
    },
    formTitle: { type: "text" },
    formDescription: { type: "textarea" },
    submitLabel: { type: "text" },
    privacyLabel: { type: "text" },
    privacyLinkLabel: { type: "text" },
    privacyHref: { type: "text" },
    optionalLabel: { type: "text" },
  },
  defaultProps: {
    title: siteContent.booking.heading,
    description: siteContent.booking.subheading,
    details: [
      {
        label: "Email",
        value: "hello@velvetdinosaur.com",
        href: "mailto:hello@velvetdinosaur.com",
      },
      {
        label: "Phone",
        value: "+44 7438 460437",
        href: "tel:+447438460437",
      },
      {
        label: "WhatsApp",
        value: "Message on WhatsApp",
        href: "https://wa.me/447438460437",
      },
    ],
    formTitle: siteContent.booking.headline,
    formDescription: siteContent.booking.intro,
    submitLabel: "Send enquiry",
    privacyLabel: "By submitting this form you agree to our",
    privacyLinkLabel: "Privacy Notice",
    privacyHref: "/privacy",
    optionalLabel: "Optional details",
  },
  render: (props) => <Contact2 {...props} />,
};
