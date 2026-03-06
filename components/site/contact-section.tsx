"use client"

import { Contact25 } from "@/components/contact25"

type ContactPayload = {
  name: string
  email: string
  message: string
}

export function ContactSection() {
  const phoneNumber = process.env.NEXT_PUBLIC_PHONE ?? "+447438460437"
  const whatsappDigits = phoneNumber.replace(/\D/g, "")
  const whatsappHref = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent("Hi Ian, I'd like to discuss a website project.")}`

  const handleSubmit = async (data: ContactPayload) => {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}))
      throw new Error(payload?.error || "Unable to send message right now.")
    }
  }

  return (
    <div id="contact">
      <Contact25
        className="py-6 md:py-8"
        title="Let's talk about your project"
        description="Share your goals, current pain points, and timeline. You will get a clear response within one business day."
        faqTitle="Questions people usually ask"
        whatsapp={{
          href: whatsappHref,
          label: "Quick chat on WhatsApp",
          helperText: "Prefer chat first? WhatsApp is often the fastest route.",
        }}
        faqs={[
          {
            question: "What's included in the £2,500 package?",
            answer:
              "The £2,500 package includes custom design and build, SEO-ready page structure, performance optimisation, contact forms, launch support, SSL, daily backups, support portal access, and handover guidance. We agree scope before development starts so deliverables are clear, and advanced features are quoted separately before build begins.",
          },
          {
            question: "Do I own my website and domain?",
            answer:
              "Yes. You retain ownership of your domain, content, and website assets. Accounts and access are set up in your name, not locked in a closed platform, so you can manage or move your site whenever you choose.",
          },
          {
            question: "What happens after the first year?",
            answer:
              "Hosting is £120/year after Year 1. Domain renewal is separate and procured at cost price. You can keep ongoing support if you want it, or run the site independently with full access and handover documentation.",
          },
          {
            question: "Can I move my site elsewhere later?",
            answer:
              "Yes. There is no lock-in. If you decide to migrate, we provide practical support, technical handover details, and a clear transition plan to keep downtime and risk low.",
          },
          {
            question: "How quickly can we start?",
            answer:
              "Most projects can start within one to two weeks, depending on scope and how ready your content is. A standard build is usually delivered in about 4-6 weeks, with clear milestones from discovery through launch.",
          },
          {
            question: "Can you improve an existing site?",
            answer:
              "Yes. We regularly improve existing websites, including redesigns, speed fixes, technical SEO improvements, and migrations away from older platforms. We can also phase improvements so you do not need a full rebuild on day one.",
          },
        ]}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
