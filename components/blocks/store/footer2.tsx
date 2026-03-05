import type { ComponentConfig } from "@measured/puck";

import { Footer2 } from "@/components/footer2";
import { siteContent } from "@/scripts/_reference/velvet/content";

type MenuItem = {
  title: string;
  links: { text: string; url: string }[];
};

export type Footer2BlockProps = {
  id?: string;
  logo?: {
    url: string;
    src: string;
    alt: string;
    title: string;
  };
  tagline?: string;
  menuItems?: MenuItem[];
  copyright?: string;
  bottomLinks?: { text: string; url: string }[];
};

const footerLinks = siteContent.footer.links.map((link: { label: string; href: string }) => ({
  text: link.label,
  url: link.href,
}));

export const footer2Config: ComponentConfig<Footer2BlockProps> = {
  fields: {
    logo: {
      type: "object",
      objectFields: {
        url: { type: "text" },
        src: { type: "text" },
        alt: { type: "text" },
        title: { type: "text" },
      },
    },
    tagline: { type: "text" },
    menuItems: {
      type: "array",
      arrayFields: {
        title: { type: "text" },
        links: {
          type: "array",
          arrayFields: {
            text: { type: "text" },
            url: { type: "text" },
          },
        },
      },
    },
    copyright: { type: "text" },
    bottomLinks: {
      type: "array",
      arrayFields: {
        text: { type: "text" },
        url: { type: "text" },
      },
    },
  },
  defaultProps: {
    logo: {
      url: "/",
      src: siteContent.brand.logo,
      alt: "Velvet Dinosaur logo",
      title: siteContent.brand.name,
    },
    tagline: siteContent.brand.tagline,
    menuItems: [
      {
        title: siteContent.brand.name,
        links: [
          ...siteContent.nav.links.map((link: { label: string; href: string }) => ({
            text: link.label,
            url: link.href,
          })),
          ...footerLinks,
        ],
      },
    ],
    copyright: `© ${new Date().getFullYear()} ${siteContent.footer.copyright}`,
    bottomLinks: footerLinks,
  },
  render: (props) => <Footer2 {...props} />,
};
