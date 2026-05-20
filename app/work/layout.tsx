import { Suspense, type ReactNode } from "react"

import { EchoNavbar } from "@/components/site/echo-navbar"
import { FloatingWhatsApp } from "@/components/site/floating-whatsapp"
import { SiteFooter } from "@/components/site/site-footer"

function getWhatsappHref() {
  const phoneNumber = process.env.NEXT_PUBLIC_PHONE ?? "+447438460437"
  const whatsappDigits = phoneNumber.replace(/\D/g, "")
  return `https://wa.me/${whatsappDigits}?text=${encodeURIComponent("Hi Ian, I'd like to discuss a website project.")}`
}

export default function WorkLayout({ children }: { children: ReactNode }) {
  const isLhci = process.env.VD_LHCI === "true" || process.env.NEXT_PUBLIC_LHCI === "true"

  return (
    <div className="relative min-h-dvh overflow-hidden">
      {isLhci ? null : (
        <>
          <Suspense fallback={null}>
            <EchoNavbar />
          </Suspense>
          <FloatingWhatsApp href={getWhatsappHref()} />
        </>
      )}
      <main className="pt-20 md:pt-24">
        <Suspense fallback={null}>{children}</Suspense>
      </main>
      {isLhci ? null : <SiteFooter />}
    </div>
  )
}
