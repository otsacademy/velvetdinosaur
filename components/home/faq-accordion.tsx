import { HOME_CARD, HOME_MONO } from "./home-shared"

export const CONTACT_FAQS = [
  {
    question: "What's included in the base package?",
    answer:
      "Custom design and build, SEO-ready page structure, performance optimisation, contact forms, launch support, SSL, daily backups, support portal access, and handover guidance. Scope is agreed before development starts; advanced features are quoted separately before build begins.",
  },
  {
    question: "Do I own my website and domain?",
    answer:
      "Yes. You retain ownership of your domain, content, and website assets. Accounts and access are set up in your name, not locked in a closed platform, so you can manage or move your site whenever you choose.",
  },
  {
    question: "What happens after the first year?",
    answer:
      "Nothing changes and nothing surprises you: it stays £100 a month, and after your first 12 months you're free to leave at any time with 30 days' notice. Hosting, security, updates, email, and content changes are all still included — there are no year-two fees to discover.",
  },
  {
    question: "Can I move my site elsewhere later?",
    answer:
      "Yes. There is no lock-in. If you decide to migrate, I provide practical support, technical handover details, and a clear transition plan to keep downtime and risk low.",
  },
  {
    question: "How quickly can we start?",
    answer:
      "Most projects can start within one to two weeks, depending on scope and content readiness. A standard build is usually delivered in about 4–6 weeks, with clear milestones from discovery through launch.",
  },
  {
    question: "Can you improve an existing site?",
    answer:
      "Yes. I regularly improve existing websites — redesigns, speed fixes, technical SEO, and migrations away from older platforms. Work can be phased so you do not need a full rebuild on day one.",
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
            <span aria-hidden className={`${HOME_MONO} text-sm text-primary`}>
              <span className="group-open:hidden">+</span>
              <span className="hidden group-open:inline">−</span>
            </span>
          </summary>
          <div className="px-5.5 pb-5 text-[13.5px] leading-relaxed text-muted-foreground">
            {faq.answer}
          </div>
        </details>
      ))}
    </div>
  )
}
