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

      <main className="pt-20 md:pt-24">
        <section id="home" className="relative px-6">
          <div className="pointer-events-none absolute inset-0 -z-10 holding-bg" aria-hidden="true" />
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.22] [background-image:radial-gradient(circle_at_1px_1px,color-mix(in_oklch,oklch(var(--vd-foreground))_18%,transparent)_1px,transparent_0)] [background-size:22px_22px]"
            aria-hidden="true"
          />

          <div className="mx-auto w-full max-w-6xl">
            <Hero1
              className="py-6 md:py-10 lg:py-8"
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
                <div className="relative flex w-full items-center justify-center lg:justify-end">
                  <div
                    className="pointer-events-none absolute h-[16rem] w-[16rem] rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,oklch(var(--vd-primary))_18%,transparent)_0%,color-mix(in_oklch,oklch(var(--vd-primary))_8%,transparent)_45%,transparent_76%)] blur-3xl sm:h-[18rem] sm:w-[18rem] lg:h-[20rem] lg:w-[20rem]"
                    aria-hidden="true"
                  />
                  <div
                    className="pointer-events-none absolute bottom-[8%] h-10 w-[62%] rounded-full bg-[color-mix(in_oklch,var(--vd-fg)_10%,transparent)] blur-3xl"
                    aria-hidden="true"
                  />
                  <div className="motion-safe:animate-vd-float relative [animation-duration:8.5s] [animation-delay:180ms]">
                    {isLhci ? (
                      <Image
                        src="/dinosaur.webp"
                        alt="Velvet Dinosaur mascot assembling from grayscale to full color"
                        width={800}
                        height={800}
                        priority
                        className="vd-hero-mascot h-[min(18rem,68vw)] w-[min(18rem,68vw)] object-cover sm:h-[min(22rem,56vw)] sm:w-[min(22rem,56vw)] lg:h-[min(26rem,34vw)] lg:w-[min(26rem,34vw)]"
                      />
                    ) : (
                      <PixelImage
                        src="/dinosaur.webp"
                        alt="Velvet Dinosaur mascot assembling from grayscale to full color"
                        grid="8x8"
                        grayscaleAnimation={false}
                        maxAnimationDelay={0}
                        pixelFadeInDuration={0}
                        className="vd-hero-mascot"
                        sizeClassName="h-[min(18rem,68vw)] w-[min(18rem,68vw)] sm:h-[min(22rem,56vw)] sm:w-[min(22rem,56vw)] lg:h-[min(26rem,34vw)] lg:w-[min(26rem,34vw)]"
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
