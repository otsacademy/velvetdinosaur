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
import { WhatsIncludedSection } from "./whats-included-section"
import { NoLockInSection } from "./no-lock-in-section"
import { PortfolioSection } from "./portfolio-section"
import { ClientReviewSection } from "./client-review-section"
import { ContactSection } from "./contact-section"
import { SiteFooter } from "./site-footer"
import { ScrollReveal } from "./scroll-reveal"

export function FullSite() {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <EchoNavbar />

      <main className="pt-24 md:pt-28">
        <section id="home" className="relative px-6">
          <div
            className="pointer-events-none absolute inset-0 -z-10 holding-bg"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.22] [background-image:radial-gradient(circle_at_1px_1px,color-mix(in_oklch,oklch(var(--vd-foreground))_18%,transparent)_1px,transparent_0)] [background-size:22px_22px]"
            aria-hidden="true"
          />

          <div className="mx-auto w-full max-w-6xl">
            <Hero1
              className="animate-vd-fade-up py-12 md:py-16 lg:py-20"
              badge="17 Years of Experience"
              heading="Named by a 3-year-old who loves dinosaurs. Backed by 17 years of experience."
              description="We build websites that look exceptional, load instantly, and stay secure, so your business can grow without wrestling with tech."
              buttons={{
                primary: { text: "Email us", url: "#contact", className: "vd-email-cta" },
              }}
              imageSlot={
                <div className="animate-vd-float [animation-delay:220ms]">
                  <div className="vd-dino-card mx-auto w-fit rounded-[calc(var(--vd-radius)+10px)] border border-border/60 bg-background/45 p-3 shadow-[0_35px_90px_-45px_color-mix(in_oklch,oklch(var(--vd-foreground))_35%,transparent)] backdrop-blur">
                    <PixelImage
                      src="/dinosaur.webp"
                      alt="Velvet Dinosaur mascot assembling from grayscale to full color"
                      grid="8x8"
                      grayscaleAnimation
                      colorRevealDelay={1500}
                      className="rounded-xl"
                      sizeClassName="h-[min(26rem,84vw)] w-[min(26rem,84vw)] sm:h-[min(30rem,70vw)] sm:w-[min(30rem,70vw)] lg:h-[min(34rem,42vw)] lg:w-[min(34rem,42vw)]"
                    />
                  </div>
                </div>
              }
            />
          </div>
        </section>

        <ScrollReveal>
          <SelectedWork />
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <GoogleReviewsSection />
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <MyStack />
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <AboutSection />
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <ServicesSection />
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <SauroCmsSection />
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <PageSpeedGuaranteeSection />
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <PricingSection />
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <WhatsIncludedSection />
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <NoLockInSection />
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <PortfolioSection />
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <ClientReviewSection />
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <ContactSection />
        </ScrollReveal>

        <SiteFooter />
      </main>
    </div>
  )
}
