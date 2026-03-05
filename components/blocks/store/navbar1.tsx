import type { ComponentConfig } from "@measured/puck";

import { Navbar1 } from "@/components/navbar1";
import { siteContent } from "@/scripts/_reference/velvet/content";

type MenuItem = {
  title: string;
  url: string;
  description?: string;
};

type NavButton = {
  title: string;
  url: string;
};

export type Navbar1BlockProps = {
  id?: string;
  sticky?: boolean | "true" | "false";
  logo?: {
    url: string;
    src: string;
    alt: string;
    title: string;
    className?: string;
  };
  menu?: MenuItem[];
  primaryButton?: NavButton;
  secondaryButton?: NavButton;
};

export const navbar1Config: ComponentConfig<Navbar1BlockProps> = {
  fields: {
    sticky: {
      type: "select",
      options: [
        { label: "Sticky", value: "true" },
        { label: "Static", value: "false" },
      ],
    },
    logo: {
      type: "object",
      objectFields: {
        url: { type: "text" },
        src: { type: "text" },
        alt: { type: "text" },
        title: { type: "text" },
        className: { type: "text" },
      },
    },
    menu: {
      type: "array",
      arrayFields: {
        title: { type: "text" },
        url: { type: "text" },
        description: { type: "text" },
      },
    },
    primaryButton: {
      type: "object",
      objectFields: {
        title: { type: "text" },
        url: { type: "text" },
      },
    },
    secondaryButton: {
      type: "object",
      objectFields: {
        title: { type: "text" },
        url: { type: "text" },
      },
    },
  },
  defaultProps: {
    sticky: "true",
    logo: {
      url: "/",
      src: siteContent.brand.logo,
      alt: "Velvet Dinosaur logo",
      title: siteContent.brand.name,
    },
    menu: siteContent.nav.links.map((link: { label: string; href: string }) => ({
      title: link.label,
      url: link.href,
    })),
    primaryButton: {
      title: siteContent.nav.cta,
      url: "#booking",
    },
  },
  render: (props) => (
    <Navbar1
      {...props}
      sticky={props.sticky === true || props.sticky === "true"}
    />
  ),
};
