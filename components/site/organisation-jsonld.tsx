import {
  COMPANY_NUMBER,
  COMPANY_REGISTERED,
  REGISTERED_NAME,
  TRADING_NAME,
} from "@/lib/legal-identity"
import { PHONE_DISPLAY } from "@/lib/contact-details"
import { resolveSiteUrl, siteDescription } from "@/lib/site-metadata"

/**
 * Organisation / local-business structured data. Emitted once per page from the
 * root layout. The registered-company fields only appear once incorporation is
 * confirmed — see lib/legal-identity.
 */
export function OrganisationJsonLd() {
  const siteUrl = resolveSiteUrl()

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${siteUrl}/#organisation`,
    name: TRADING_NAME,
    url: siteUrl,
    logo: `${siteUrl}/logo.webp`,
    image: `${siteUrl}/dinosaur-512.webp`,
    description: siteDescription,
    email: "hello@velvetdinosaur.com",
    telephone: PHONE_DISPLAY,
    priceRange: "£99/month",
    founder: { "@type": "Person", name: "Ian Wickens" },
    address: {
      "@type": "PostalAddress",
      streetAddress: "16 Holloway Lane",
      addressLocality: "Minster Lovell, Witney",
      addressRegion: "Oxfordshire",
      postalCode: "OX29 0AU",
      addressCountry: "GB",
    },
    areaServed: { "@type": "Country", name: "United Kingdom" },
    knowsAbout: [
      "Website design",
      "Managed website hosting",
      "Content management systems",
      "Website maintenance",
    ],
  }

  if (COMPANY_REGISTERED) {
    data.legalName = REGISTERED_NAME
    data.identifier = {
      "@type": "PropertyValue",
      name: "Companies House company number",
      value: COMPANY_NUMBER,
    }
  }

  return (
    <script
      type="application/ld+json"
      // Values are our own constants, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
