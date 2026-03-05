"use client"

import type { ComponentConfig } from "@measured/puck"

import { EditableText } from "@/components/demo/editable"
import { demoKey } from "@/components/demo/demo-helpers"
import { Badge } from "@/components/ui/badge"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Section, SectionHeading } from "@/components/ui/section"

type TechItem = {
  name: string
  description: string
}

export type TechStackProps = {
  id?: string
  heading: string
  subheading: string
  items: TechItem[]
}

const techDefaults = [
  {
    name: "React 19",
    description: "The building blocks for modern web pages: fast, interactive screens users can click and use.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
        <circle cx="12" cy="12" r="2.5" />
        <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <ellipse
          cx="12"
          cy="12"
          rx="10"
          ry="4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          transform="rotate(60 12 12)"
        />
        <ellipse
          cx="12"
          cy="12"
          rx="10"
          ry="4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          transform="rotate(120 12 12)"
        />
      </svg>
    ),
  },
  {
    name: "Next.js",
    description:
      "A React toolkit that makes sites load quicker and rank better on Google (and handles pages, routing, SEO).",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
        <path d="M11.572 0c-.176 0-.31.001-.358.007a19.76 19.76 0 0 0-.364.033C7.443.346 4.25 2.185 2.228 5.012a11.875 11.875 0 0 0-2.119 5.243c-.096.659-.108.854-.108 1.747s.012 1.089.108 1.748c.652 4.506 3.86 8.292 8.209 9.695.779.251 1.6.422 2.534.525.363.04 1.935.04 2.299 0 1.611-.178 2.977-.577 4.323-1.264.207-.106.247-.134.219-.158-.02-.013-.9-1.193-1.955-2.62l-1.919-2.592-2.404-3.558a338.739 338.739 0 0 0-2.422-3.556c-.009-.002-.018 1.579-.023 3.51-.007 3.38-.01 3.515-.052 3.595a.426.426 0 0 1-.206.214c-.075.037-.14.044-.495.044H7.81l-.108-.068a.438.438 0 0 1-.157-.171l-.05-.106.006-4.703.007-4.705.072-.092a.645.645 0 0 1 .174-.143c.096-.047.134-.051.54-.051.478 0 .558.018.682.154.035.038 1.337 1.999 2.895 4.361l4.735 7.17 1.9 2.879.096-.063a12.317 12.317 0 0 0 2.466-2.163 11.944 11.944 0 0 0 2.824-6.134c.096-.66.108-.854.108-1.748 0-.893-.012-1.088-.108-1.747-.652-4.506-3.859-8.292-8.208-9.695a12.597 12.597 0 0 0-2.499-.523A33.119 33.119 0 0 0 11.572 0zm4.069 7.217c.347 0 .408.005.486.047a.473.473 0 0 1 .237.277c.018.06.023 1.365.018 4.304l-.006 4.218-.744-1.14-.746-1.14v-3.066c0-1.982.01-3.097.023-3.15a.478.478 0 0 1 .233-.296c.096-.05.13-.054.5-.054z" />
      </svg>
    ),
  },
  {
    name: "Vite",
    description: "A super-fast workshop for developers: speeds up building and previewing the site while you work.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
        <path d="m8.286 10.578.512-8.657a.306.306 0 0 1 .247-.282L17.377.006a.306.306 0 0 1 .353.385l-1.558 5.403a.306.306 0 0 0 .352.385l2.388-.46a.306.306 0 0 1 .332.438l-6.79 13.55-.123.19a.294.294 0 0 1-.252.14c-.177 0-.35-.152-.305-.369l1.095-5.301a.306.306 0 0 0-.388-.355l-1.433.435a.306.306 0 0 1-.389-.354l.69-3.375a.306.306 0 0 0-.37-.36l-2.32.536a.306.306 0 0 1-.374-.316z" />
      </svg>
    ),
  },
  {
    name: "Tailwind",
    description: "A styling system that makes designs consistent and clean without messy CSS.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
        <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8Zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.976 12 6.001 12Z" />
      </svg>
    ),
  },
  {
    name: "Cloudflare R2",
    description: "Speedy image access with durable object storage for global delivery.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M7 18h10a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.4-1.6A4 4 0 0 0 7 18z" />
        <path d="M8.5 18v-4h7v4" />
        <path d="M9 14h6" />
      </svg>
    ),
  },
  {
    name: "BetterAuth",
    description: "Modern, secure login and account management built for scale.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 3 4 7v6c0 5 3.5 7.5 8 9 4.5-1.5 8-4 8-9V7l-8-4z" />
        <path d="M8 12h8" />
        <path d="M12 9v6" />
      </svg>
    ),
  },
  {
    name: "Social Integrations",
    description: "Facebook + Instagram integrations for content, leads, and analytics.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="7" r="3" />
        <circle cx="18" cy="17" r="3" />
        <path d="M8.7 10.6 15 8.2" />
        <path d="M8.7 13.4 15 15.8" />
      </svg>
    ),
  },
  {
    name: "Google Reviews + Calendar",
    description: "Google sign-in, review embeds, and calendar scheduling integrations.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="8" />
        <path d="m12 7 1.6 3.2 3.5.5-2.5 2.4.6 3.5-3.2-1.7-3.2 1.7.6-3.5-2.5-2.4 3.5-.5z" />
      </svg>
    ),
  },
  {
    name: "Node",
    description: "The engine that lets JavaScript run on the server (not just in the browser).",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
        <path d="M11.998 24c-.321 0-.641-.084-.922-.247l-2.936-1.737c-.438-.245-.224-.332-.08-.383.585-.203.703-.25 1.328-.604.065-.037.151-.023.218.017l2.256 1.339a.29.29 0 0 0 .272 0l8.795-5.076a.277.277 0 0 0 .134-.238V6.921a.283.283 0 0 0-.137-.242l-8.791-5.072a.278.278 0 0 0-.271 0L3.075 6.68a.284.284 0 0 0-.139.24v10.15c0 .1.053.19.138.241l2.409 1.392c1.307.654 2.108-.116 2.108-.89V7.787c0-.142.114-.253.256-.253h1.115c.139 0 .255.11.255.253v10.021c0 1.745-.95 2.745-2.604 2.745-.508 0-.909 0-2.026-.551L2.28 18.675a1.857 1.857 0 0 1-.922-1.604V6.921c0-.659.353-1.275.922-1.603l8.795-5.082a1.873 1.873 0 0 1 1.846 0l8.794 5.082c.57.329.924.944.924 1.603v10.15a1.86 1.86 0 0 1-.924 1.604l-8.794 5.078c-.28.163-.6.247-.923.247z" />
      </svg>
    ),
  },
  {
    name: "Express",
    description: "A simple framework for Node that helps build the site's back-end and APIs quickly.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
        <path d="M24 18.588a1.529 1.529 0 0 1-1.895-.72l-3.45-4.771-.5-.667-4.003 5.444a1.466 1.466 0 0 1-1.802.708l5.158-6.92-4.798-6.251a1.595 1.595 0 0 1 1.9.666l3.576 4.83 3.596-4.81a1.435 1.435 0 0 1 1.788-.668L21.708 7.9l-2.522 3.283a.666.666 0 0 0 0 .994l4.804 6.412zM.002 11.576l.42-2.075c1.154-4.103 5.858-5.81 9.094-3.27 1.895 1.489 2.368 3.597 2.275 5.973H1.116C.943 16.447 4.005 19.009 7.92 17.7a4.078 4.078 0 0 0 2.582-2.876c.207-.666.548-.78 1.174-.588a5.417 5.417 0 0 1-2.589 3.957 6.272 6.272 0 0 1-7.306-.933 6.575 6.575 0 0 1-1.64-3.858c0-.235-.08-.455-.134-.666A88.33 88.33 0 0 1 0 11.577zm1.127-.286h9.654c-.06-3.076-2.001-5.258-4.59-5.278-2.882-.04-4.944 2.094-5.071 5.264z" />
      </svg>
    ),
  },
  {
    name: "MongoDB",
    description: "A flexible database for storing things like users, content, and form submissions.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
        <path d="M17.193 9.555c-1.264-5.58-4.252-7.414-4.573-8.115-.28-.394-.53-.954-.735-1.44-.036.495-.055.685-.523 1.184-.723.566-4.438 3.682-4.74 10.02-.282 5.912 4.27 9.435 4.888 9.884l.07.05A73.49 73.49 0 0 1 11.91 24h.481c.114-1.032.284-2.056.51-3.07.417-.296.604-.463.85-.693a11.342 11.342 0 0 0 3.639-8.464c.01-.814-.103-1.662-.197-2.218zm-5.336 8.195s0-8.291.275-8.29c.213 0 .49 10.695.49 10.695-.381-.045-.765-1.76-.765-2.405z" />
      </svg>
    ),
  },
  {
    name: "MariaDB",
    description: "A traditional, reliable database (great for structured data like orders, bookings, records).",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
        <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
      </svg>
    ),
  },
  {
    name: "Bare Metal Servers",
    description: "Powerful dedicated servers in a data centre: your own computer on the internet to host everything.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
        <path d="M2 5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5zm2 0v4h16V5H4zm-2 9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4zm2 0v4h16v-4H4zm3-7.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm0 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
      </svg>
    ),
  },
]

export function TechStack(props: TechStackProps) {
  const key = (path: string) => demoKey(props.id, path)
  const techItems = props.items?.length
    ? props.items
    : techDefaults.map(({ name, description }) => ({ name, description }))

  return (
    <Section maxWidth="4xl" className="bg-muted/20">
      <SectionHeading>
        <span className="inline-flex items-center justify-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 md:h-9 md:w-9 text-muted-foreground"
            aria-hidden
          >
            <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" />
            <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" />
            <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" />
          </svg>
          <EditableText demoKey={key("techStack.heading")} value={props.heading} as="span" showIcon={false} />
        </span>
      </SectionHeading>
      <p className="text-center text-muted-foreground mb-6 md:mb-8">
        <EditableText
          demoKey={key("techStack.subheading")}
          value={props.subheading}
          as="span"
          multiline
          showIcon={false}
        />
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {techItems.map((tech, index) => {
          const icon = techDefaults[index]?.icon

          return (
            <HoverCard key={index} openDelay={200} closeDelay={100}>
              <HoverCardTrigger asChild>
                <Badge
                  variant="secondary"
                  className="text-sm px-4 py-2 bg-background text-foreground border border-border cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-colors flex items-center gap-2"
                >
                  <span className="text-primary">{icon}</span>
                  <EditableText
                    demoKey={key(`techStack.items.${index}.name`)}
                    value={tech.name}
                    as="span"
                    showIcon={false}
                  />
                </Badge>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="flex items-start gap-3">
                  <span className="text-primary mt-0.5">{icon}</span>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-1">
                      <EditableText
                        demoKey={key(`techStack.items.${index}.name`)}
                        value={tech.name}
                        as="span"
                        showIcon={false}
                      />
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      <EditableText
                        demoKey={key(`techStack.items.${index}.description`)}
                        value={tech.description}
                        as="span"
                        multiline
                        showIcon={false}
                      />
                    </p>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          )
        })}
      </div>
    </Section>
  )
}

export const techStackConfig: ComponentConfig<TechStackProps> = {
  fields: {
    heading: { type: "text" },
    subheading: { type: "textarea" },
    items: {
      type: "array",
      arrayFields: {
        name: { type: "text" },
        description: { type: "textarea" },
      },
    },
  },
  defaultProps: {
    heading: "",
    subheading: "",
    items: [],
  },
  render: (props) => <TechStack {...props} />,
}
