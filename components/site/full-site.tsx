import type { ReactNode } from "react"
import { Hero1 } from "@/components/hero1"
import { SelectedWork } from "./selected-work"
import { SiteFooter } from "./site-footer"
import { mainHeroCopy } from "@/lib/site-copy"

type RevealWrapper = (content: ReactNode, delay?: number) => ReactNode

async function renderSiteChrome(whatsappHref: string) {
  const [{ EchoNavbar }, { FloatingWhatsApp }] = await Promise.all([
    import("./echo-navbar"),
    import("./floating-whatsapp"),
  ])

  return (
    <>
      <EchoNavbar />
      <FloatingWhatsApp href={whatsappHref} />
    </>
  )
}

async function renderHeroImageSlot(
  heroMascotSizeClassName: string,
  heroTrustPillClassName: string,
) {
  const { PixelImage } = await import("@/components/holding/pixel-image.client")

  return (
    <div className="relative flex w-full items-center justify-center overflow-visible">
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 z-10 hidden lg:block">
          <div className={`${heroTrustPillClassName} absolute left-[-8%] top-[5%]`}>
            <span className="text-[0.9375rem] font-semibold text-foreground">100/100</span>
            <span className="text-[0.6875rem] font-medium text-muted-foreground">Lighthouse</span>
          </div>
          <div className={`${heroTrustPillClassName} absolute left-[-14%] top-[42%]`}>
            <span className="text-[0.9375rem] font-semibold text-foreground">5.0 ★</span>
            <span className="text-[0.6875rem] font-medium text-muted-foreground">Google rated</span>
          </div>
          <div className={`${heroTrustPillClassName} absolute bottom-[8%] left-[-10%]`}>
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
  )
}

async function renderSecondarySections(withReveal: RevealWrapper) {
  const [
    { MyStack },
    { AboutServicesSection },
    { SelectedWork },
    { SauroCmsSection },
    { PageSpeedGuaranteeSection },
    { PricingSection },
    { NoLockInSection },
    { ClientReviewSection },
    { ContactSection },
  ] = await Promise.all([
    import("./my-stack"),
    import("./about-services-section"),
    import("./selected-work"),
    import("./sauro-cms-section"),
    import("./pagespeed-guarantee-section"),
    import("./pricing-section"),
    import("./no-lock-in-section"),
    import("./client-review-section"),
    import("./contact-section"),
  ])

  return (
    <>
      {withReveal(<MyStack />, 100)}

      <div className="bg-muted/40">
        {withReveal(<AboutServicesSection />, 100)}
      </div>

      {withReveal(<SelectedWork />, 100)}

      {withReveal(<SauroCmsSection />, 100)}

      {withReveal(<PageSpeedGuaranteeSection />, 100)}

      <div className="bg-muted/40">
        {withReveal(<PricingSection />, 100)}
      </div>

      {withReveal(<NoLockInSection />, 100)}

      {withReveal(<ClientReviewSection />, 100)}

      <div className="bg-muted/40">
        {withReveal(<ContactSection />, 100)}
      </div>
    </>
  )
}

export async function FullSite() {
  const phoneNumber = process.env.NEXT_PUBLIC_PHONE ?? "+447438460437"
  const whatsappDigits = phoneNumber.replace(/\D/g, "")
  const whatsappHref = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent("Hi Ian, I'd like to discuss a website project.")}`
  const isLhci = process.env.VD_LHCI === "true" || process.env.NEXT_PUBLIC_LHCI === "true"
  const heroMascotSizeClassName =
    "h-[min(17rem,65vw)] w-[min(17rem,65vw)] sm:h-[min(21rem,50vw)] sm:w-[min(21rem,50vw)] lg:h-[min(26rem,36vw)] lg:w-[min(26rem,36vw)]"
  const heroTrustPillClassName =
    "vd-hover-lift-sm pointer-events-auto flex flex-col items-start gap-0.5 rounded-xl border border-border/80 bg-background/90 px-3.5 py-2 shadow-sm backdrop-blur-xl transition-all"
  const siteChrome = isLhci ? null : await renderSiteChrome(whatsappHref)
  const heroImageSlot = isLhci
    ? undefined
    : await renderHeroImageSlot(heroMascotSizeClassName, heroTrustPillClassName)
  const secondarySections = isLhci
    ? null
    : await import("./scroll-reveal").then(({ ScrollReveal }) =>
        renderSecondarySections((content, delay) => <ScrollReveal delay={delay}>{content}</ScrollReveal>)
      )

  return (
    <div className="relative min-h-dvh overflow-hidden">
      {siteChrome}

      <main className="pt-20 md:pt-24">
        <section id="home" className="relative px-6 pb-6">

          <div className="mx-auto w-full max-w-6xl">
            <Hero1
              className="py-8 md:py-12 lg:py-10"
              badge={mainHeroCopy.badge}
              heading={mainHeroCopy.heading}
              description={mainHeroCopy.description}
              supportingLine={mainHeroCopy.supportingLine}
              buttons={{
                primary: {
                  text: "Start your project",
                  url: "#contact",
                  buttonClassName: "vd-dino-cta h-12 rounded-full px-7 text-[0.9375rem] font-medium",
                },
                secondary: {
                  text: "Chat on WhatsApp",
                  url: whatsappHref,
                  buttonClassName: "vd-pill-outline h-12 rounded-full px-7 text-[0.9375rem] font-medium",
                },
              }}
              imageSlot={heroImageSlot}
            />
          </div>
        </section>

        {isLhci ? <SelectedWork /> : null}

        {secondarySections}

        <SiteFooter />
      </main>
    </div>
  )
}
