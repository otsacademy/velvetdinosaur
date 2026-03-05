"use client"

import type { ComponentConfig } from "@measured/puck"
import { motion } from "framer-motion"
import React from "react"

import { ShadcnblocksContainer } from "@/components/blocks/store/shadcnblocks/shared"
import { Card, CardContent } from "@/components/ui/card"

const handwrittenTextClasses = "flex gap-3 font-caveat text-xs md:text-xl tracking-tight text-foreground"

export type ShadcnblocksFeature245Props = {
  headline: string
  description: string
  features: Array<string | { value?: string }>
  imageSrc: string
  imageAlt: string
}

export function ShadcnblocksFeature245(props: ShadcnblocksFeature245Props) {
  const features = (props.features || [])
    .map((item) => (typeof item === "string" ? item : item?.value))
    .filter((item): item is string => Boolean(item))
  const left = features.slice(0, 4)
  const right = features.slice(4, 8)

  return (
    <ShadcnblocksContainer>
      <section className="bg-background py-8">
        <div className="relative container flex flex-col items-center overflow-hidden">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-5xl font-semibold tracking-tighter text-foreground md:text-7xl">
              {props.headline}
            </h1>
            <p className="my-4 tracking-tighter text-muted-foreground/60 md:text-xl">
              {props.description}
            </p>
          </div>
          <div className="relative z-10 mx-auto mt-12 min-h-full max-w-3xl md:w-1/2">
            <div className="absolute -left-52 z-10 hidden h-full flex-col items-end justify-between md:flex lg:-left-62">
              {left.map((feature, i) => (
                <motion.div
                  key={`${feature}-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    ease: [0.33, 1, 0.68, 1],
                    duration: 0.7,
                    delay: 0.7 + i * 0.18,
                  }}
                  className={handwrittenTextClasses}
                >
                  {feature}
                  {React.createElement([Line1, Line2, Line3, Line4][i], {
                    className: "mt-4 w-10 md:w-16",
                  })}
                </motion.div>
              ))}
            </div>
            <div className="absolute -right-58 z-10 hidden h-full flex-col justify-between md:flex lg:-right-64">
              {right.map((feature, i) => (
                <motion.div
                  key={`${feature}-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    ease: [0.33, 1, 0.68, 1],
                    duration: 0.7,
                    delay: 0.7 + i * 0.18,
                  }}
                  className={handwrittenTextClasses}
                >
                  {React.createElement([Line1, Line2, Line3, Line4][i], {
                    className: "mt-4 w-10 scale-x-[-1] md:w-16",
                  })}
                  {feature}
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 200 }}
              animate={{ opacity: 100, y: 0 }}
              transition={{ ease: [0.33, 1, 0.68, 1], duration: 0.8 }}
              className="relative z-0"
            >
              <Card className="group h-130 w-full rounded-4xl border border-border bg-background p-2 shadow-none lg:p-3">
                <CardContent className="size-full rounded-3xl border-2 border-background bg-muted">
                  <img src={props.imageSrc} className="size-full" alt={props.imageAlt} />
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </ShadcnblocksContainer>
  )
}

export const shadcnblocksFeature245Config: ComponentConfig<ShadcnblocksFeature245Props> = {
  fields: {
    headline: { type: "text" },
    description: { type: "textarea" },
    features: {
      type: "array",
      arrayFields: { value: { type: "text" } },
    },
    imageSrc: { type: "text" },
    imageAlt: { type: "text" },
  },
  defaultProps: {
    headline: "Loaded with Features",
    description: "Experience a comprehensive suite of powerful features designed to elevate your workflow.",
    features: [
      "Dark Mode",
      "Real-time Updates",
      "Authentication",
      "Drag&Drop",
      "API Integration",
      "Role Based Access",
      "Multi-Language",
      "AutoSave",
    ],
    imageSrc: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-1.svg",
    imageAlt: "Feature preview",
  },
  render: (props) => <ShadcnblocksFeature245 {...props} />,
}

const Line1 = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="61" height="26" viewBox="0 0 61 26" fill="none" {...props}>
    <path
      d="M1.9646 1.91797C17.3747 7.75772 32.6529 11.57 48.5386 15.7286C49.4358 15.9635 58.8632 18.2083 58.5163 17.679C55.5766 13.1937 48.1816 12.4253 45.0204 8.60143C41.6482 4.52239 53.6346 15.2056 58.7437 16.5867C60.5905 17.0859 54.584 17.7874 53.7729 17.9579C48.9299 18.9758 45.2528 21.6554 41.1771 24.3266"
      stroke="currentColor"
      strokeWidth="2.46548"
      strokeLinecap="round"
    />
  </svg>
)
const Line2 = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="74" height="32" viewBox="0 0 74 32" fill="none" {...props}>
    <path
      d="M49.8383 29.7093C56.0593 26.3815 62.2923 22.5754 68.9255 20.0624C69.9895 19.6593 71.3535 19.2757 72.2604 18.5417C73.5246 17.5184 64.9285 11.3625 63.8012 10.4351C62.8289 9.63523 51.4736 -1.49746 51.3055 1.71016C51.2106 3.52199 50.914 11.4552 48.9691 11.3533C42.6504 11.0222 9.82535 6.12723 3.49897 5.79571C1.55368 5.69377 1.32727 12.2958 1.22636 14.2215C1.14589 15.7572 0.522713 17.2364 2.41951 17.3358C6.59008 17.5543 37.3937 21.733 41.5643 21.9516C42.201 21.9849 51.105 21.6355 51.1608 22.5901C51.2617 24.32 49.404 28.8174 48.589 30.2542"
      stroke="currentColor"
      strokeWidth="1.90473"
      strokeLinecap="round"
    />
  </svg>
)
const Line3 = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="63" height="32" viewBox="0 0 63 32" fill="none" {...props}>
    <path
      d="M1.4458 14.4424C4.99614 10.5607 8.34323 6.53007 13.0964 4.11905C14.5444 3.38458 19.3389 0.639317 21.0232 1.57508C25.6159 4.12659 18.5671 16.2199 17.5207 19.0879C14.8301 26.4621 15.6961 32.2209 25.0788 29.9273C35.1999 27.4533 47.485 21.5318 55.7907 15.1429C57.9879 13.4527 63.8769 11.1241 58.3715 11.1241C56.3948 11.1241 48.074 10.9476 54.5003 11.7509C55.0729 11.8225 61.5422 11.6344 61.5422 11.9353C61.5422 12.6635 58.6285 15.4157 58.1872 16.3964C57.4223 18.0961 56.5281 19.1618 56.5281 21.0788"
      stroke="currentColor"
      strokeWidth="2.24706"
      strokeLinecap="round"
    />
  </svg>
)
const Line4 = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="82" height="45" viewBox="0 0 82 45" fill="none" {...props}>
    <path
      d="M2.07928 1.78438C14.4865 20.4361 33.245 54.8532 60.3785 38.9569C67.0254 35.0628 69.6429 28.8775 72.9705 22.292C73.1143 22.0075 75.3857 14.886 74.4369 15.319C71.8963 16.4786 56.8203 23.0816 66.5539 18.7069C67.5836 18.244 74.045 13.9211 75.102 14.4551C77.9817 15.9102 79.704 30.0755 80.7698 33.3184"
      stroke="currentColor"
      strokeWidth="2.40332"
      strokeLinecap="round"
    />
  </svg>
)
