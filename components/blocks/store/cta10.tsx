import type { ComponentConfig } from "@measured/puck";

import { Cta10 } from "@/components/cta10";
import { siteContent } from "@/scripts/_reference/velvet/content";

export type Cta10BlockProps = {
  id?: string;
  heading: string;
  description: string;
  buttons?: {
    primary?: { text: string; url: string };
    secondary?: { text: string; url: string };
  };
};

export const cta10Config: ComponentConfig<Cta10BlockProps> = {
  fields: {
    heading: { type: "text" },
    description: { type: "textarea" },
    buttons: {
      type: "object",
      objectFields: {
        primary: {
          type: "object",
          objectFields: {
            text: { type: "text" },
            url: { type: "text" },
          },
        },
        secondary: {
          type: "object",
          objectFields: {
            text: { type: "text" },
            url: { type: "text" },
          },
        },
      },
    },
  },
  defaultProps: {
    heading: siteContent.stickyCta.message,
    description: siteContent.booking.trustLine,
    buttons: {
      primary: { text: siteContent.nav.cta, url: "#booking" },
      secondary: { text: siteContent.hero.secondaryCta, url: "#pricing" },
    },
  },
  render: (props) => <Cta10 {...props} />,
};
