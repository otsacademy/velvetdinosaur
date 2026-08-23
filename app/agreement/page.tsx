import type { Metadata } from "next"
import Image from "next/image"

import { DesignShell } from "@/components/home/design-shell"
import { HOME_BTN_PRIMARY, HOME_CARD, HOME_CONTAINER, HOME_MONO } from "@/components/home/home-shared"
import { siteName } from "@/lib/site-metadata"
import {
  AGREEMENT_SECTIONS,
  AGREEMENT_VERSION,
  SHORT_VERSION,
  type AgreementBlock,
} from "./agreement-content"

import "./agreement.css"

const agreementDescription =
  "The plain-English Velvet Dinosaur managed website service agreement: £99 a month, everything included, 14-day free demo, 30-day money-back guarantee, and your content always yours."

export const metadata: Metadata = {
  title: "Service Agreement",
  description: agreementDescription,
  alternates: { canonical: "/agreement" },
  openGraph: {
    type: "website",
    url: "/agreement",
    siteName,
    title: `Service Agreement | ${siteName}`,
    description: agreementDescription,
  },
}

/** Renders **bold** runs inside agreement copy. */
function RichText({ text }: { text: string }) {
  const parts = text.split("**")
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? <strong key={index}>{part}</strong> : <span key={index}>{part}</span>,
      )}
    </>
  )
}

function Block({ block }: { block: AgreementBlock }) {
  switch (block.type) {
    case "h3":
      return <h3 className="vd-agreement-h3">{block.text}</h3>
    case "list":
      return (
        <ul>
          {block.items.map((item) => (
            <li key={item}>
              <RichText text={item} />
            </li>
          ))}
        </ul>
      )
    case "ordered":
      return (
        <ol>
          {block.items.map((item) => (
            <li key={item}>
              <RichText text={item} />
            </li>
          ))}
        </ol>
      )
    case "keybox":
      return (
        <div className="vd-agreement-keybox">
          <RichText text={block.text} />
        </div>
      )
    case "small":
      return (
        <p className="vd-agreement-small">
          <RichText text={block.text} />
        </p>
      )
    default:
      return (
        <p>
          <RichText text={block.text} />
        </p>
      )
  }
}

const ORDER_FIELDS: [string, string][] = [
  ["Customer/business", "[Business name]"],
  ["Contact", "[Name]"],
  ["Address", "[Address]"],
  ["Email", "[Email]"],
  ["Website/domain", "[Domain]"],
  ["Monthly subscription", "£99"],
  ["Initial term", "12 months"],
  ["Subscription start date", "[Date]"],
  ["Money-back guarantee expires", "[Date]"],
  ["Included functionality", "[Website / CMS / bookings / forms / inbox / social / etc.]"],
  ["Any separately agreed additions", "[Details]"],
]

export default function AgreementPage() {
  return (
    <DesignShell>
      <div className="vd-agreement-print">
        <div className={`${HOME_CONTAINER} vd-agreement`}>
          <header className="vd-agreement-head">
            <div className={`${HOME_MONO} vd-agreement-kicker`}>The small print, in plain English</div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-4">
              <Image src="/logo.webp" alt="Velvet Dinosaur" width={150} height={40} priority />
              <h1 className="m-0 text-4xl font-extrabold tracking-[-0.033em] md:text-[42px]">
                Service Agreement
              </h1>
            </div>
            <p className="m-0 mt-4 max-w-[640px] text-[15.5px] leading-[1.7] text-muted-foreground">
              Between <strong className="text-foreground">Velvet Dinosaur</strong> (&ldquo;we&rdquo;,
              &ldquo;us&rdquo;, &ldquo;our&rdquo;) and the business or organisation named in the order
              (&ldquo;Customer&rdquo;, &ldquo;you&rdquo;, &ldquo;your&rdquo;). Your order, together
              with this agreement, forms the contract between us. {AGREEMENT_VERSION}. Governed by
              the law of England and Wales.
            </p>
          </header>

          <div className="vd-agreement-short">
            <div className={`${HOME_MONO} mb-3 text-[10px] text-primary`}>The short version</div>
            <ul className="m-0 grid list-none gap-2.5 p-0 sm:grid-cols-2">
              {SHORT_VERSION.map((line) => (
                <li key={line} className="flex items-baseline gap-2.5 text-[13.5px] leading-relaxed">
                  <span
                    aria-hidden
                    className="inline-flex h-[17px] w-[17px] flex-none translate-y-0.5 items-center justify-center rounded-full bg-primary/10 text-[10.5px] font-bold text-primary"
                  >
                    ✓
                  </span>
                  <span>
                    <RichText text={line} />
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="vd-agreement-body">
            <nav aria-label="Agreement contents" className="vd-agreement-toc">
              <div className={`${HOME_MONO} mb-3 text-[10px] text-muted-foreground`}>Contents</div>
              <ol className="m-0 flex list-none flex-col gap-1.5 p-0">
                {AGREEMENT_SECTIONS.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="vd-agreement-toc-link">
                      <span className={`${HOME_MONO} vd-agreement-toc-num`}>{section.num}</span>
                      {section.title}
                    </a>
                  </li>
                ))}
                <li>
                  <a href="#order" className="vd-agreement-toc-link">
                    <span className={`${HOME_MONO} vd-agreement-toc-num`}>29</span>
                    The order
                  </a>
                </li>
                <li>
                  <a href="#acceptance" className="vd-agreement-toc-link">
                    <span className={`${HOME_MONO} vd-agreement-toc-num`}>30</span>
                    Acceptance
                  </a>
                </li>
              </ol>
              <a
                href="/downloads/velvet-dinosaur-service-agreement.pdf"
                className={`${HOME_BTN_PRIMARY} vd-agreement-download mt-6 px-5 py-2.5 text-[13px]`}
              >
                Download as PDF
              </a>
            </nav>

            <article className="vd-agreement-doc">
              {AGREEMENT_SECTIONS.map((section) => (
                <section key={section.id} id={section.id} className="vd-agreement-section">
                  <h2>
                    <span className={`${HOME_MONO} vd-agreement-num`}>{section.num}</span>
                    {section.title}
                  </h2>
                  {section.blocks.map((block, index) => (
                    <Block key={index} block={block} />
                  ))}
                </section>
              ))}

              <section id="order" className="vd-agreement-section">
                <h2>
                  <span className={`${HOME_MONO} vd-agreement-num`}>29</span>
                  The order
                </h2>
                <p>The customer order should record at least:</p>
                <div className={`${HOME_CARD} vd-agreement-order`}>
                  {ORDER_FIELDS.map(([label, value]) => (
                    <div key={label} className="vd-agreement-order-row">
                      <span className="vd-agreement-order-label">{label}</span>
                      <span className="vd-agreement-order-value">{value}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section id="acceptance" className="vd-agreement-section">
                <h2>
                  <span className={`${HOME_MONO} vd-agreement-num`}>30</span>
                  Acceptance
                </h2>
                <p>
                  The agreement can be accepted electronically as part of the Velvet Dinosaur signup
                  process. By selecting <strong>&ldquo;Subscribe&rdquo;</strong>, signing an order or
                  otherwise expressly accepting these terms, the customer confirms that they have
                  authority to enter into the agreement on behalf of the named business.
                </p>
                <div className="vd-agreement-sig">
                  <div className="vd-agreement-sigline">For Velvet Dinosaur — name, signature, date</div>
                  <div className="vd-agreement-sigline">For the customer — name, signature, date</div>
                </div>
                <p className="vd-agreement-small mt-8">
                  Velvet Dinosaur · 16 Holloway Lane, Minster Lovell, Witney OX29 0AU ·
                  hello@velvetdinosaur.com
                </p>
              </section>
            </article>
          </div>
        </div>
      </div>
    </DesignShell>
  )
}
