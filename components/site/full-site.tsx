import type { ReactNode } from "react"
import Image from "next/image"
import { Hero1 } from "@/components/hero1"
import { PixelImage } from "@/components/holding/pixel-image.client"
import { EchoNavbar } from "./echo-navbar"
import { SelectedWork } from "./selected-work"
import { GoogleReviewsSection } from "./google-reviews-section"
import { MyStack } from "./my-stack"
import { AboutSection } from "./about-section"
import { ServicesSection } from "./services-section"
import { SauroCmsSection } from "./sauro-cms-section"
import { PageSpeedGuaranteeSection } from "./pagespeed-guarantee-section"
import { PricingSection } from "./pricing-section"
import { NoLockInSection } from "./no-lock-in-section"
import { ClientReviewSection } from "./client-review-section"
import { ContactSection } from "./contact-section"
import { SiteFooter } from "./site-footer"
import { ScrollReveal } from "./scroll-reveal"
import { FloatingWhatsApp } from "./floating-whatsapp"
import { mainHeroCopy } from "@/lib/site-copy"

export function FullSite() {
  const phoneNumber = process.env.NEXT_PUBLIC_PHONE ?? "+447438460437"
  const whatsappDigits = phoneNumber.replace(/\D/g, "")
  const whatsappHref = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent("Hi Ian, I'd like to discuss a website project.")}`
  const isLhci = process.env.VD_LHCI === "true" || process.env.NEXT_PUBLIC_LHCI === "true"
  const withReveal = (content: ReactNode, delay?: number) =>
    isLhci ? content : <ScrollReveal delay={delay}>{content}</ScrollReveal>

  return (
    <div className="relative min-h-dvh overflow-hidden">
      {isLhci ? null : <EchoNavbar />}
      {isLhci ? null : <FloatingWhatsApp href={whatsappHref} />}

      <main className="pt-24 md:pt-28">
        <section id="home" className="relative px-6">
          <div className="pointer-events-none absolute inset-0 -z-10 holding-bg" aria-hidden="true" />
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.22] [background-image:radial-gradient(circle_at_1px_1px,color-mix(in_oklch,oklch(var(--vd-foreground))_18%,transparent)_1px,transparent_0)] [background-size:22px_22px]"
            aria-hidden="true"
          />

          <div className="mx-auto w-full max-w-6xl">
            <Hero1
              className="py-10 md:py-14 lg:py-16"
              badge={mainHeroCopy.badge}
              heading={mainHeroCopy.heading}
              description={mainHeroCopy.description}
              supportingLine={mainHeroCopy.supportingLine}
              buttons={{
                primary: {
                  text: "Start your project",
                  url: "#contact",
                  buttonClassName: "vd-email-cta h-12 px-6 text-base font-semibold",
                },
                secondary: {
                  text: "Chat on WhatsApp",
                  url: whatsappHref,
                  buttonClassName: "h-12 px-6 text-base",
                },
              }}
              imageSlot={
                <div>
                  <div className="vd-dino-card mx-auto w-fit rounded-[calc(var(--vd-radius)+10px)] border border-transparent bg-transparent p-3 shadow-none backdrop-blur-none hover:border-border/60 hover:bg-background/45 hover:backdrop-blur">
                    {isLhci ? (
                      <Image
                        src="/dinosaur.webp"
                        alt="Velvet Dinosaur mascot assembling from grayscale to full color"
                        width={800}
                        height={800}
                        priority
                        className="h-[min(24rem,84vw)] w-[min(24rem,84vw)] rounded-xl object-cover sm:h-[min(28rem,68vw)] sm:w-[min(28rem,68vw)] lg:h-[min(32rem,40vw)] lg:w-[min(32rem,40vw)]"
                      />
                    ) : (
                      <PixelImage
                        src="/dinosaur.webp"
                        alt="Velvet Dinosaur mascot assembling from grayscale to full color"
                        grid="8x8"
                        grayscaleAnimation={false}
                        maxAnimationDelay={0}
                        pixelFadeInDuration={0}
                        className="rounded-xl"
                        sizeClassName="h-[min(24rem,84vw)] w-[min(24rem,84vw)] sm:h-[min(28rem,68vw)] sm:w-[min(28rem,68vw)] lg:h-[min(32rem,40vw)] lg:w-[min(32rem,40vw)]"
                      />
                    )}
                  </div>
                </div>
              }
            />
          </div>
        </section>

        {withReveal(<SelectedWork />)}

        {isLhci ? null : (
          <>
            <div className="bg-[color-mix(in_srgb,var(--vd-muted)_82%,var(--vd-bg))]">
              {withReveal(<GoogleReviewsSection />, 100)}
            </div>

            {withReveal(<MyStack />, 100)}

            <div className="bg-[color-mix(in_srgb,var(--vd-accent)_78%,var(--vd-bg))]">
              {withReveal(<AboutSection />, 100)}
            </div>

            {withReveal(<ServicesSection />, 100)}

            <div className="bg-[color-mix(in_srgb,var(--vd-primary)_4%,var(--vd-bg))]">
              {withReveal(<SauroCmsSection />, 100)}
            </div>

            {withReveal(<PageSpeedGuaranteeSection />, 100)}

            {withReveal(<PricingSection />, 100)}

            <div className="bg-[color-mix(in_srgb,var(--vd-accent)_65%,var(--vd-bg))]">
              {withReveal(<NoLockInSection />, 100)}
            </div>

            {withReveal(<ClientReviewSection />, 100)}

            <div className="bg-[color-mix(in_srgb,var(--vd-muted)_84%,var(--vd-bg))]">
              {withReveal(<ContactSection />, 100)}
            </div>
          </>
        )}

        <SiteFooter />
      </main>
    </div>
  )
}
