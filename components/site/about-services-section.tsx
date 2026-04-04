import Image from "next/image"
import { Star } from "lucide-react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { r2PublicUrl } from "@/lib/public-assets"
import { googleReviews } from "./google-reviews-section"

const bioParagraphs = [
  "Based in Oxfordshire, I build bespoke websites and apps for organisations seeking something different.",
  "For most of my professional career, I have worked in the NHS across specialist medical devices, clinical research, and corporate governance. This unique medical background enables me to bring precision, clear communication, and a problem-solving mindset to complex digital projects; these values are consistently embedded in my work.",
  "In addition, I have spent most of my adult life building sites independently: rebuilding charity platforms, coding conference websites, and understanding web technologies at a fundamental level. This hands-on experience fuels my passion and means my clients benefit from both technical depth and genuine curiosity.",
  "Velvet Dinosaur was inspired by my 3-year-old daughter, who is obsessed with blue and dinosaurs.",
]

const bioParagraphClassName =
  "font-body text-base font-normal leading-8 text-[var(--vd-copy)] [text-align:justify]"

export function AboutServicesSection() {
  return (
    <section id="about-services" className="py-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="space-y-10">
          <div id="about" className="scroll-mt-28">
            <h2 className="vd-as-title mb-6">About</h2>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.75fr)_minmax(18rem,0.95fr)] lg:gap-10">
              <div className="space-y-7 lg:pr-4">
                <figure className="w-fit text-center">
                  <div className="h-[110px] w-[110px] shrink-0 overflow-hidden rounded-full">
                    <Image
                      src={r2PublicUrl("profile.webp")}
                      alt="Ian Wickens"
                      width={110}
                      height={110}
                      className="h-full w-full object-cover"
                      priority
                    />
                  </div>
                  <figcaption className="mt-3 text-sm font-medium tracking-[0.01em] text-foreground">
                    Ian Wickens
                  </figcaption>
                </figure>

                <div className="space-y-5">
                  {bioParagraphs.map((paragraph) => (
                    <p key={paragraph} className={bioParagraphClassName}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              <aside className="vd-surface-panel vd-soft-panel self-start rounded-[1.5rem] p-6 lg:p-7">
                <div className="space-y-5">
                  <Badge
                    variant="outline"
                    className="w-fit gap-2 border-[color-mix(in_oklch,var(--vd-primary)_24%,var(--vd-border))] bg-[color-mix(in_oklch,var(--vd-primary)_8%,var(--vd-bg))] px-3 py-1.5 text-[var(--vd-primary)]"
                  >
                    <Star className="h-3.5 w-3.5 fill-current" />
                    Google rating: 5.0
                  </Badge>

                  <div className="space-y-2">
                    <h3 className="vd-as-section-heading text-xl">Reviews &amp; credentials</h3>
                    <p className="text-sm leading-6 text-[var(--vd-copy)]">
                      Founder-led from first call to launch, backed by independent Google reviews from recent client work.
                    </p>
                  </div>

                  <Accordion
                    type="single"
                    collapsible
                    className="rounded-[1rem] border border-[color-mix(in_oklch,var(--vd-border)_78%,transparent)] bg-background/80 px-4"
                  >
                    {googleReviews.map((review) => (
                      <AccordionItem
                        key={review.sourceUrl}
                        value={review.sourceUrl}
                        className="last:border-b-0"
                      >
                        <AccordionTrigger className="py-4 text-left">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="text-sm font-semibold text-foreground">{review.name}</span>
                              <span className="text-xs text-[var(--vd-copy-muted)]">{review.company}</span>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-[var(--vd-copy-muted)]">
                              <span className="flex items-center gap-0.5 text-[var(--vd-primary)]">
                                {Array.from({ length: 5 }).map((_, index) => (
                                  <Star key={index} className="h-3.5 w-3.5 fill-current" />
                                ))}
                              </span>
                              <span>{review.date}</span>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-[var(--vd-copy)]">
                          <p className="text-sm leading-7 [text-align:justify]">{review.quote}</p>
                          <a
                            className="mt-3 inline-flex text-sm font-medium text-foreground underline-offset-4 hover:underline"
                            href={review.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View on Google Maps
                          </a>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
