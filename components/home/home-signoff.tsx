import Image from "next/image"
import Link from "next/link"
import { ArrowRight, MessageCircle, Phone } from "lucide-react"

import { PHONE_DISPLAY, PHONE_HREF, WHATSAPP_HREF } from "@/lib/contact-details"
import {
  BTN_LG,
  HOME_BTN_PRIMARY,
  HOME_CONTAINER,
  LETTER_COLUMN,
  LETTER_HAND,
  LETTER_LINK,
} from "./home-shared"

/** Phone and WhatsApp, so a direct line to Ian sits beside every main button. */
export function TalkDirect() {
  const link = `${LETTER_LINK} inline-flex items-center gap-2 text-lg`
  return (
    <>
      <a href={PHONE_HREF} className={link}>
        <Phone aria-hidden width={18} height={18} strokeWidth={2} />
        {PHONE_DISPLAY}
      </a>
      <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className={link}>
        <MessageCircle aria-hidden width={18} height={18} strokeWidth={2} />
        WhatsApp
      </a>
    </>
  )
}

// How the letter ends: a closing line, the signature, the ways to reply, and
// a postscript about the name.
export function HomeSignOff() {
  return (
    <section className={`${HOME_CONTAINER} pb-20 pt-20 sm:pb-28 sm:pt-24`}>
      <div data-reveal className={LETTER_COLUMN}>
        <p className="m-0 text-pretty font-serif text-[clamp(1.5rem,2.5vw,2rem)] leading-[1.35] tracking-[-0.008em]">
          That’s everything. If it sounds right for you, tell me a little about your business and
          I’ll make a start on your preview. You’ll hear back from me within one business day.
        </p>
        <p className="m-0 mt-[34px] font-serif text-[25px]">Yours,</p>
        <p className={`${LETTER_HAND} m-0 mt-0.5 origin-left -rotate-[4deg] text-[92px]`}>Ian</p>
        <p className="m-0 mt-3.5 text-[17px] text-muted-foreground">
          Ian Wickens · Velvet Dinosaur, Minster Lovell, Oxfordshire
        </p>
        <div className="mt-[38px] flex flex-wrap items-center gap-x-7 gap-y-4">
          <Link href="/contact" className={`${HOME_BTN_PRIMARY} ${BTN_LG}`}>
            Request your free preview
            <ArrowRight aria-hidden width={20} height={20} strokeWidth={2.2} />
          </Link>
          <TalkDirect />
        </div>
        <div className="mt-[60px] flex flex-wrap items-center gap-x-[30px] gap-y-[22px] border-t border-border pt-[34px]">
          <Image
            src="/brand/mascot.webp"
            alt="The Velvet Dinosaur mascot, a soft toy dinosaur"
            width={373}
            height={343}
            sizes="150px"
            className="h-auto w-[150px] flex-none"
          />
          <p className="m-0 flex-[1_1_320px] font-serif text-[23px] leading-[1.4]">
            <strong className="font-semibold">P.S.</strong> Why “Velvet Dinosaur”? My daughter
            named it when she was three.
          </p>
        </div>
      </div>
    </section>
  )
}
