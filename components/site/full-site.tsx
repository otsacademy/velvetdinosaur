import type { ReactNode } from "react"
import { Hero1 } from "@/components/hero1"
import { PixelImage } from "@/components/holding/pixel-image.client"
import { EchoNavbar } from "./echo-navbar"
import { SelectedWork } from "./selected-work"
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
  const heroMascotSizeClassName =
    "h-[min(15.5rem,60vw)] w-[min(15.5rem,60vw)] sm:h-[min(19rem,50vw)] sm:w-[min(19rem,50vw)] lg:h-[min(22rem,29vw)] lg:w-[min(22rem,29vw)]"
  const heroTrustPillClassName =
    "vd-hover-lift-sm pointer-events-auto flex flex-col items-start gap-0.5 rounded-xl border border-border/80 bg-background/90 px-3.5 py-2 shadow-sm backdrop-blur-xl transition-all"
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
              className="py-4 md:py-8 lg:py-6"
              badge={mainHeroCopy.badge}
              heading={mainHeroCopy.heading}
              description={mainHeroCopy.description}
              supportingLine={mainHeroCopy.supportingLine}
              buttons={{
                primary: {
                  text: "Start your project",
                  url: "#contact",
                  buttonClassName: "vd-email-cta vd-pill-primary h-12 rounded-full px-7 text-[0.9375rem] font-medium",
                },
                secondary: {
                  text: "Chat on WhatsApp",
                  url: whatsappHref,
                  buttonClassName: "vd-pill-outline h-12 rounded-full px-7 text-[0.9375rem] font-medium",
                },
              }}
              imageSlot={isLhci ? undefined : (
                <div className="relative flex w-full items-center justify-center overflow-visible">
                  <div
                    className="pointer-events-none absolute h-[13rem] w-[13rem] rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,oklch(var(--vd-primary))_14%,transparent)_0%,color-mix(in_oklch,oklch(var(--vd-primary))_6%,transparent)_45%,transparent_76%)] blur-2xl sm:h-[15rem] sm:w-[15rem] lg:h-[17rem] lg:w-[17rem]"
                    aria-hidden="true"
                  />
                  <div
                    className="pointer-events-none absolute bottom-[10%] h-8 w-[56%] rounded-full bg-[color-mix(in_oklch,var(--vd-fg)_8%,transparent)] blur-2xl"
                    aria-hidden="true"
                  />
                  <div className="motion-safe:animate-vd-float relative [animation-duration:8.5s] [animation-delay:180ms]">
                    <div className="pointer-events-none absolute inset-0 z-10 hidden lg:block">
                      <div className={`${heroTrustPillClassName} absolute left-[2%] top-[5%]`}>
                        <span className="text-[0.9375rem] font-semibold text-foreground">100/100</span>
                        <span className="text-[0.6875rem] font-medium text-muted-foreground">Lighthouse</span>
                      </div>
                      <div className={`${heroTrustPillClassName} absolute left-[-6%] top-[42%]`}>
                        <span className="text-[0.9375rem] font-semibold text-foreground">5.0 ★</span>
                        <span className="text-[0.6875rem] font-medium text-muted-foreground">Google rated</span>
                      </div>
                      <div className={`${heroTrustPillClassName} absolute bottom-[8%] left-[-3%]`}>
                        <span className="text-[0.9375rem] font-semibold text-foreground">4–6 wk</span>
                        <span className="text-[0.6875rem] font-medium text-muted-foreground">Delivery</span>
                      </div>
                    </div>
                    <PixelImage
                      src="/dinosaur.webp"
                      alt="Velvet Dinosaur mascot assembling from grayscale to full color"
                      grid="8x8"
                      grayscaleAnimation={false}
                      maxAnimationDelay={0}
                      pixelFadeInDuration={0}
                      className="vd-hero-mascot"
                      sizeClassName={heroMascotSizeClassName}
                    />
                  </div>
                </div>
              )}
            />
          </div>
        </section>

        {withReveal(<SelectedWork />)}

        {isLhci ? null : (
          <>
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
