import { HOME_CONTAINER, HOME_KICKER, LETTER_COLUMN, LETTER_H2, PlusMark } from "./home-shared"

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

export type Faq = { question: string; answer: string }

// Native <details> accordion: no client JavaScript, and every answer is in the
// page for search engines and for readers who search within the page.
export function FaqAccordion({
  faqs = CONTACT_FAQS,
  openFirst = true,
}: {
  faqs?: readonly Faq[]
  openFirst?: boolean
}) {
  return (
    <div>
      {faqs.map((faq, index) => (
        <details
          key={faq.question}
          open={openFirst && index === 0}
          className="group border-t border-border last:border-b"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-[22px] font-serif text-[22px] font-medium leading-[1.2] tracking-[-0.005em] sm:text-[25px] [&::-webkit-details-marker]:hidden">
            <span>{faq.question}</span>
            <PlusMark />
          </summary>
          <p className="m-0 mb-[26px] max-w-[640px] text-muted-foreground">{faq.answer}</p>
        </details>
      ))}
    </div>
  )
}

export function HomeQuestions() {
  return (
    <section id="questions" className={`${HOME_CONTAINER} scroll-mt-20 pt-20 sm:pt-[104px]`}>
      <div className={LETTER_COLUMN}>
        <p className={`${HOME_KICKER} m-0 mb-3 text-accent`}>Part five · Questions</p>
        <h2 className={`${LETTER_H2} mb-[30px]`}>Questions people usually ask.</h2>
        <FaqAccordion />
      </div>
    </section>
  )
}
