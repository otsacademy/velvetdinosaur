import type { Data } from "@measured/puck"

function makeId(suffix: string) {
  return `vd_demo_editor_${suffix}`
}

export function getDemoEditorSeedData(mainSiteHref: string): Data {
  const contactHref = `${mainSiteHref}#contact`

  return {
    root: {
      props: {
        title: "New page",
      },
    },
    content: [
      {
        type: "Hero",
        props: {
          id: makeId("hero"),
          eyebrow: "Fictional interiors studio",
          title: "Calm, tailored interiors for homes that need to work beautifully.",
          subtitle:
            "Harbour & Pine is a made-up business used for demonstration purposes. The page is here to show realistic editing controls without exposing any client material.",
          primaryLabel: "Book a consultation",
          primaryLink: {
            href: contactHref,
            target: "_self",
            rel: "",
          },
          secondaryLabel: "Ask about your project",
          secondaryLink: {
            href: contactHref,
            target: "_self",
            rel: "",
          },
          imageSrc: "/assets/demo-media/harbour-pine/rooms/living-room-concept.svg",
          imageAlt: "Fictional living room concept board",
        },
      },
      {
        type: "FeatureGrid",
        props: {
          id: makeId("editing"),
          heading: "What this fictional studio offers",
          items: [
            {
              title: "Whole-room design",
              description:
                "Concepts for kitchens, living spaces, bedrooms, and the awkward in-between areas that usually get ignored.",
              icon: "sparkles",
            },
            {
              title: "Joinery and materials",
              description:
                "Thoughtful combinations of timber, paint, lighting, and storage so the finished space feels coherent.",
              icon: "layers",
            },
            {
              title: "Styling and finishing",
              description:
                "Final dressing, soft furnishings, and practical details that make the room feel settled rather than staged.",
              icon: "shield",
            },
          ],
        },
      },
      {
        type: "Text",
        props: {
          id: makeId("founder"),
          heading: "A themed sample page with its own demo gallery",
          body:
            "This example is intentionally fictional. The copy, visuals, and media folders were created only for this public demo so visitors can test realistic editing without seeing any real client assets or private work.",
        },
      },
      {
        type: "Image",
        props: {
          id: makeId("materials-board"),
          src: "/assets/demo-media/harbour-pine/materials/oak-and-limewash-board.svg",
          alt: "Fictional oak and limewash materials board",
          caption:
            "Material boards in the demo gallery sit in their own folders so prospects can try a more realistic media workflow.",
        },
      },
      {
        type: "FeatureGrid",
        props: {
          id: makeId("delivery"),
          heading: "How a project like this might unfold",
          items: [
            {
              title: "Brief and moodboards",
              description:
                "Define the tone, practical requirements, and the rooms that matter most before any detailed design work begins.",
              icon: "sparkles",
            },
            {
              title: "Design refinement",
              description:
                "Test layouts, finishes, and fixtures until the scheme feels resolved rather than just presentable.",
              icon: "layers",
            },
            {
              title: "Delivery and styling",
              description:
                "Coordinate installation, final touches, and a clear handover so the space feels ready to live in.",
              icon: "shield",
            },
          ],
        },
      },
      {
        type: "Image",
        props: {
          id: makeId("styling-board"),
          src: "/assets/demo-media/harbour-pine/styling/lighting-and-textiles-board.svg",
          alt: "Fictional styling board with lighting and textiles",
          caption:
            "Swap this out using the preloaded demo gallery or upload your own image for a disposable preview.",
        },
      },
      {
        type: "CTA",
        props: {
          id: makeId("cta"),
          title: "Ready to shape your own site?",
          subtitle:
            "This demo page is fictional on purpose. The editing workflow is real, but the copy and visuals are safe placeholders you can replace.",
          buttonLabel: "Start a project conversation",
          buttonLink: {
            href: contactHref,
            target: "_self",
            rel: "",
          },
        },
      },
    ] as Data["content"],
  } as Data
}
