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

export function FullSite() {
  const phoneNumber = process.env.NEXT_PUBLIC_PHONE ?? "+447438460437"
  const whatsappDigits = phoneNumber.replace(/\D/g, "")
  const whatsappHref = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent("Hi Ian, I'd like to discuss a website project.")}`

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <EchoNavbar />
      <FloatingWhatsApp href={whatsappHref} />

      <main className="pt-24 md:pt-28">
        <section id="home" className="relative px-6">
          <div className="pointer-events-none absolute inset-0 -z-10 holding-bg" aria-hidden="true" />
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.22] [background-image:radial-gradient(circle_at_1px_1px,color-mix(in_oklch,oklch(var(--vd-foreground))_18%,transparent)_1px,transparent_0)] [background-size:22px_22px]"
            aria-hidden="true"
          />

          <div className="mx-auto w-full max-w-6xl">
            <Hero1
              className="animate-vd-fade-up py-10 md:py-14 lg:py-16"
              badge="17 years of product and platform experience"
              heading="Fast, beautiful, secure websites that turn visitors into clients."
              description="Work directly with an experienced developer to launch a custom site built for conversion, search visibility, and long-term maintainability."
              supportingLine="Named by a 3-year-old who loved blue dinosaurs. Built with senior-level engineering discipline."
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
                <div className="animate-vd-float [animation-delay:220ms]">
                  <div className="vd-dino-card mx-auto w-fit rounded-[calc(var(--vd-radius)+10px)] border border-transparent bg-transparent p-3 shadow-none backdrop-blur-none hover:border-border/60 hover:bg-background/45 hover:backdrop-blur">
                    <PixelImage
                      src="/dinosaur.webp"
                      alt="Velvet Dinosaur mascot assembling from grayscale to full color"
                      grid="8x8"
                      grayscaleAnimation={false}
                      maxAnimationDelay={0}
                      pixelFadeInDuration={350}
                      className="rounded-xl"
                      sizeClassName="h-[min(24rem,84vw)] w-[min(24rem,84vw)] sm:h-[min(28rem,68vw)] sm:w-[min(28rem,68vw)] lg:h-[min(32rem,40vw)] lg:w-[min(32rem,40vw)]"
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

        <div className="bg-[color-mix(in_srgb,var(--vd-muted)_82%,var(--vd-bg))]">
          <ScrollReveal delay={100}>
            <GoogleReviewsSection />
          </ScrollReveal>
        </div>

        <ScrollReveal delay={100}>
          <MyStack />
        </ScrollReveal>

        <div className="bg-[color-mix(in_srgb,var(--vd-accent)_78%,var(--vd-bg))]">
          <ScrollReveal delay={100}>
            <AboutSection />
          </ScrollReveal>
        </div>

        <ScrollReveal delay={100}>
          <ServicesSection />
        </ScrollReveal>

        <div className="bg-[color-mix(in_srgb,var(--vd-primary)_12%,var(--vd-muted))]">
          <ScrollReveal delay={100}>
            <SauroCmsSection />
          </ScrollReveal>
        </div>

        <div className="bg-[color-mix(in_srgb,var(--vd-primary)_8%,var(--vd-accent))]">
          <ScrollReveal delay={100}>
            <PageSpeedGuaranteeSection />
          </ScrollReveal>
        </div>

        <ScrollReveal delay={100}>
          <PricingSection />
        </ScrollReveal>

        <div className="bg-[color-mix(in_srgb,var(--vd-accent)_65%,var(--vd-bg))]">
          <ScrollReveal delay={100}>
            <NoLockInSection />
          </ScrollReveal>
        </div>

        <ScrollReveal delay={100}>
          <ClientReviewSection />
        </ScrollReveal>

        <div className="bg-[color-mix(in_srgb,var(--vd-muted)_84%,var(--vd-bg))]">
          <ScrollReveal delay={100}>
            <ContactSection />
          </ScrollReveal>
        </div>

        <SiteFooter />
      </main>
    </div>
  )
}
