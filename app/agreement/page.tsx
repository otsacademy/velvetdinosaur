import type { Metadata } from "next"
import Image from "next/image"

import { DesignShell } from "@/components/home/design-shell"
import { HOME_CONTAINER, HOME_MONO } from "@/components/home/home-shared"
import { siteName } from "@/lib/site-metadata"

import "./agreement.css"

const agreementDescription =
  "The plain-English Velvet Dinosaur service agreement: £99 a month, everything included, 14-day free demo, 30-day money-back guarantee, and your content always yours."

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

function Section({
  num,
  title,
  children,
}: {
  num: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="vd-agreement-section">
      <h2>
        <span className="vd-agreement-num">{num}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

export default function AgreementPage() {
  return (
    <DesignShell>
      <div className="vd-agreement-print">
        <div className={`${HOME_CONTAINER} vd-agreement`}>
          <article className="vd-agreement-doc">
            <header className="vd-agreement-head">
              <Image src="/logo.webp" alt="Velvet Dinosaur" width={180} height={48} priority />
              <h1>Website Service Agreement</h1>
              <p className="vd-agreement-meta">
                Between <strong>Velvet Dinosaur</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;) and the customer named in
                the order (&ldquo;you&rdquo;, &ldquo;your&rdquo;).
              </p>
              <p className="vd-agreement-meta">
                Version 2.0 — August 2026. Governed by the law of England and Wales.
              </p>
            </header>

            <div className="vd-agreement-keybox">
              <strong>The short version:</strong> we design and build your new website{" "}
              <strong>before</strong> you pay anything. You try it free for 14 days. If you subscribe,
              it costs <strong>£99 per month</strong>, everything included, for an initial 12 months —
              then rolling monthly, leave with 30 days&rsquo; notice. Your first 30 days are covered by
              our money-back guarantee. Your domain, content, and data are always yours.
            </div>

            <Section num="1" title="The service">
              <p>For £99 per month we provide a fully managed website for your business:</p>
              <ul>
                <li>
                  a professionally designed website shaped around your business, brand, services, and
                  content;
                </li>
                <li>
                  your own administration area (our Sauro CMS) to edit pages, text, photos, prices,
                  opening hours, news, and more — though you never have to use it, and can simply ask
                  us to make changes;
                </li>
                <li>
                  business tools included at no extra cost: contact forms, a central enquiry inbox,
                  and — where appropriate for your business — an integrated booking system;
                </li>
                <li>
                  hosting, SSL certificate, daily backups, security maintenance, software updates, and
                  monitoring;
                </li>
                <li>email for your domain, and connection of your social media profiles;</li>
                <li>
                  a standard business domain registered in your name (subject to a reasonable annual
                  registration cost), which remains yours;
                </li>
                <li>
                  support by email, chat, telephone, video call, our support system, or in person
                  where practical.
                </li>
              </ul>
              <p>
                There is <strong>no setup fee and no build fee</strong> — ever.
              </p>
            </Section>

            <Section num="2" title="The free 14-day demonstration">
              <p>
                Before you commit to anything, we build a working demonstration of your new website
                and send you a private sign-up link. You set your own password and can try everything
                — edit text, replace images, test the forms, try the booking system, and view it all
                on your phone.
              </p>
              <ul>
                <li>
                  The demonstration lasts <strong>14 days</strong> and costs nothing.
                </li>
                <li>It is private: hidden from search engines and only reachable via its link.</li>
                <li>
                  If you decide not to proceed, the demonstration and everything in it is{" "}
                  <strong>deleted</strong>. That is the end of it — no obligation and no chasing.
                </li>
              </ul>
            </Section>

            <Section num="3" title="Subscribing and launching">
              <ul>
                <li>
                  When you subscribe, you agree to this agreement and an initial term of{" "}
                  <strong>12 months at £99 per month</strong>, payable monthly in advance.
                </li>
                <li>
                  We then spend up to <strong>seven days</strong> refining the site with you —
                  photographs, colours, wording, layout, opening hours — by whichever channel suits
                  you.
                </li>
                <li>
                  Once you approve it, your site launches on your own domain. Launch can happen sooner
                  than seven days if you are happy earlier.
                </li>
              </ul>
            </Section>

            <Section num="4" title="Our 30-day money-back guarantee">
              <div className="vd-agreement-keybox">
                We want you to stay because you value the service, not because you regret signing a
                contract. If, during your <strong>first 30 days</strong> as a subscriber, you decide
                Velvet Dinosaur is not right for your business, tell us. We will cancel the service
                and <strong>refund everything you have paid us</strong>.
              </div>
              <p className="vd-agreement-small">
                This is our own guarantee to you, given deliberately as a business. It sits alongside
                — and does not replace — any statutory rights you may have.
              </p>
            </Section>

            <Section num="5" title="After the first 12 months">
              <p>When your initial term ends, you choose:</p>
              <ul>
                <li>
                  <strong>Continue.</strong> Your service rolls on monthly at the same £99 per month,
                  and you may cancel at any time with 30 days&rsquo; notice. Nothing else changes and
                  there are no year-two fees.
                </li>
                <li>
                  <strong>Refresh &amp; Renew.</strong> Renew for another 12 months and we will{" "}
                  <strong>redesign your website completely, free of charge</strong>. Your content,
                  bookings, customers, and settings stay exactly as they are — only the design is
                  refreshed. You get a refinement period before the new design launches, just like
                  your first launch.
                </li>
              </ul>
            </Section>

            <Section num="6" title="What is yours">
              <p>
                <strong>Your business. Your data. Your domain.</strong> You retain ownership of:
              </p>
              <ul>
                <li>your domain name;</li>
                <li>your branding, photographs, and written content;</li>
                <li>
                  your business data — enquiries, bookings, customer details, and CMS content — which
                  you may ask us to export for you at any time.
                </li>
              </ul>
              <p>
                The website runs on our Sauro platform (the software, CMS, and tooling we build and
                maintain). The platform itself remains ours — what runs <em>on</em> it, and everything
                you put into it, is yours. If you leave, we will provide a practical export of your
                content and data and reasonable help with your transition.
              </p>
            </Section>

            <Section num="7" title="What we may quote separately">
              <p>
                The monthly price covers the website and the standard platform tools described in
                section 1. Work that is genuinely bespoke to your business alone — for example,
                integrating your website with your own internal systems, databases, or accounting
                software — is outside the standard service. If you ever want something like that, we
                will quote it separately and plainly before doing anything. You are never charged
                extra without agreeing it first.
              </p>
            </Section>

            <Section num="8" title="Paying us">
              <ul>
                <li>£99 per month, payable monthly in advance from the date you subscribe.</li>
                <li>
                  If a payment fails, we will let you know and retry before anything else happens. If
                  payment is not made within 14 days of its due date, we may pause the website until
                  it is — we will always warn you first.
                </li>
                <li>
                  We may change the monthly price only with at least 60 days&rsquo; written notice,
                  and any change takes effect no earlier than the start of your next renewal term.
                </li>
              </ul>
            </Section>

            <Section num="9" title="Ending the service">
              <ul>
                <li>
                  <strong>Within your first 30 days:</strong> cancel under the money-back guarantee
                  (section 4) for a full refund.
                </li>
                <li>
                  <strong>During the initial 12 months:</strong> the service continues to the end of
                  the initial term, after which either of us may end it with 30 days&rsquo; notice.
                </li>
                <li>
                  <strong>After the initial term:</strong> cancel any time with 30 days&rsquo; notice.
                </li>
                <li>
                  When the service ends, we keep an export of your content and data available to you
                  for 30 days, and your domain is transferred or pointed wherever you choose.
                </li>
                <li>
                  We may end the service immediately only for something serious — unlawful use of the
                  site, or a fundamental breach of this agreement — and we will always try to resolve
                  things with you first.
                </li>
              </ul>
            </Section>

            <Section num="10" title="Being sensible with each other">
              <ul>
                <li>
                  You promise that the content you give us (text, photographs, logos) is yours to use,
                  and that your website will not be used for anything unlawful.
                </li>
                <li>
                  We promise to look after your website and your data carefully, to keep the software
                  updated and secure, and to tell you promptly if something goes wrong that affects
                  you.
                </li>
                <li>
                  We process personal data in line with UK data protection law, only to provide the
                  service, and we delete demonstration data as described in section 2.
                </li>
                <li>
                  Neither of us is liable for losses that are not reasonably foreseeable, and nothing
                  in this agreement limits liability for death or personal injury caused by
                  negligence, or for fraud.
                </li>
                <li>
                  Our total liability to you in any 12-month period is limited to the amounts you have
                  paid us in that period.
                </li>
              </ul>
            </Section>

            <Section num="11" title="The legal bits, plainly">
              <ul>
                <li>This agreement is between you and Velvet Dinosaur only; nobody else has rights under it.</li>
                <li>
                  It is governed by the law of <strong>England and Wales</strong>, and the courts of
                  England and Wales have exclusive jurisdiction.
                </li>
                <li>If any part of this agreement is found unenforceable, the rest still stands.</li>
                <li>This document, together with your order, is the whole agreement between us about the service.</li>
              </ul>
            </Section>

            <Section num="12" title="Signatures">
              <div className="vd-agreement-sig">
                <div className="vd-agreement-sigline">For Velvet Dinosaur — name, signature, date</div>
                <div className="vd-agreement-sigline">For the customer — name, signature, date</div>
              </div>
            </Section>

            <footer className="vd-agreement-foot">
              Velvet Dinosaur · 16 Holloway Lane, Minster Lovell, Witney OX29 0AU ·
              hello@velvetdinosaur.com
            </footer>
          </article>

          <div className="vd-agreement-actions">
            <a className="vd-agreement-download" href="/downloads/velvet-dinosaur-service-agreement.pdf">
              Download as PDF
            </a>
            <span className={`${HOME_MONO} vd-agreement-actions-note`}>
              The agreement every customer reads before signing — no setup fee, ever.
            </span>
          </div>
        </div>
      </div>
    </DesignShell>
  )
}
