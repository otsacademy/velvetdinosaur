import { HOME_CARD, HOME_KICKER } from "./home-shared"

export const CONTACT_FAQS = [
  {
    question: "What's included in the £99 a month?",
    answer:
      "Everything your website needs: the design and build of your site, hosting, SSL, daily backups, security and software updates, your own CMS admin area, contact forms and enquiry inbox, email for your domain, and small content changes done for you. There is no setup fee and nothing extra to pay.",
  },
  {
    question: "How does the free preview work?",
    answer:
      "I build a working version of your new website first, then send you a private sign-up link. You set your own password and can try everything — edit text, swap photos, test the forms, view it on your phone. You have 14 days. If you're not interested, the preview is simply deleted and it costs you nothing.",
  },
  {
    question: "What happens after I subscribe?",
    answer:
      "We spend up to seven days refining the site together — by email, chat, video call, or in person where practical — then it launches on your domain. Your first 30 days are covered by my money-back guarantee: if it isn't right for your business, tell me and I'll refund everything you've paid.",
  },
  {
    question: "Do I own my website and domain?",
    answer:
      "Your domain, content, photographs, and business data are always yours, and you can export your data at any time. Your site runs on my Sauro platform, which I keep updated and improving for you — but what's yours stays yours.",
  },
  {
    question: "What happens after the first year?",
    answer:
      "Nothing changes and nothing surprises you: it stays £99 a month on a rolling basis with 30 days' notice. Or renew for another 12 months and I'll refresh your design completely free — your content, bookings, and settings stay exactly as they are.",
  },
  {
    question: "Can I move my site elsewhere later?",
    answer:
      "Yes. There is no lock-in. If you decide to migrate, I provide practical support, technical handover details, and a clear transition plan to keep downtime and risk low.",
  },
] as const

// Native <details> accordion — no client JS, matches the design's +/− marks.
export function FaqAccordion() {
  return (
    <div className="flex max-w-[820px] flex-col gap-2.5">
      {CONTACT_FAQS.map((faq) => (
        <details key={faq.question} className={`${HOME_CARD} group overflow-hidden`}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3.5 px-5.5 py-4.5 text-[14.5px] font-semibold text-foreground [&::-webkit-details-marker]:hidden">
            {faq.question}
            <span aria-hidden className={`${HOME_KICKER} text-sm text-primary`}>
              <span className="group-open:hidden">+</span>
              <span className="hidden group-open:inline">−</span>
            </span>
          </summary>
          <div className="px-5.5 pb-5 text-[14px] leading-relaxed text-muted-foreground">
            {faq.answer}
          </div>
        </details>
      ))}
    </div>
  )
}
