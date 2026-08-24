import { HOME_CARD, HOME_KICKER } from "./home-shared"

export const CONTACT_FAQS = [
  {
    question: "What is included in the £99 a month?",
    answer:
      "Your monthly fee covers absolutely everything. I design and build your site. I also handle the secure hosting and daily backups. You get a private admin area to easily update the site yourself. The package includes built-in contact forms and a custom email address. I even take care of small content changes for you. There are no setup fees and nothing extra to pay.",
  },
  {
    question: "How does the free preview work?",
    answer:
      "I build a working version of your website first. I then send you a private link to try it out. You set your own password and can edit the text or swap photos. You get fourteen full days to test it. The preview is simply deleted if you are not interested. It costs you absolutely nothing.",
  },
  {
    question: "What happens after I subscribe?",
    answer:
      "We spend up to seven days refining the site together. We can do this by email or video call or in person where practical. The site then launches on your own domain name. Your first thirty days are covered by a full money back guarantee. I will refund everything you paid if the site is not right for your business.",
  },
  {
    question: "Do I own my website and domain?",
    answer:
      "You always own your domain name and your content. Your business data and photographs belong to you. You can export your data at any time. The site runs on my custom Sauro platform. I constantly update and improve the platform for you but your content remains entirely yours.",
  },
  {
    question: "What happens after the first year?",
    answer:
      "Nothing changes and there are no surprises. The price stays at £99 a month on a rolling basis. You only need to give thirty days of notice to cancel. I will even refresh your design completely free if you renew for another twelve months. All your content and settings stay exactly as they are.",
  },
  {
    question: "Can I move my site elsewhere later?",
    answer:
      "Yes. There is absolutely no lock in. I provide practical support and technical handover details if you ever decide to migrate. I create a clear transition plan to keep your downtime low and your business safe.",
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
