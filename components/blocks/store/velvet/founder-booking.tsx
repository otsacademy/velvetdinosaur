"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import type { ComponentConfig } from "@measured/puck"
import { Check, MessageCircle, Phone, Shield, Timer, Video, Zap } from "lucide-react"

import { EditableText } from "@/components/content/editable"
import { contentKey } from "@/components/content/content-keys"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Section } from "@/components/ui/section"
import { useContactForm } from "@/components/blocks/store/velvet/shared/use-contact-form"
import { buildCdnImageUrl } from "@/lib/uploads"

type StringItem = string | { value?: string }

type BookingBenefit = {
  lead: string
  detail?: string
}

type FormLabels = {
  nameLabel: string
  emailLabel: string
  messageLabel: string
  messagePlaceholder: string
  optionalDetailsLabel: string
  telephoneLabel: string
  preferredContactLabel: string
  submitLabel: string
  submittingLabel: string
  privacyNotePrefix: string
  privacyNoteLinkLabel: string
  privacyNoteSuffix: string
}

export type FounderBookingProps = {
  id?: string
  profileImageLight: string
  profileImageDark: string
  profileImageAlt: string
  primaryCtaLabel: string
  whatsappLabel: string
  phoneLabel: string
  tagline: string
  headline: string
  intro: string
  benefits: BookingBenefit[]
  timelineHeading: string
  timelineItems: StringItem[]
  notes: StringItem[]
  heading: string
  subheading: string
  formLabels: FormLabels
  contactOptions: StringItem[]
  formSuccessMessage: string
  formErrorMessage: string
  privacyHref: string
  whatsappMessage: string
}

function normalizeItems(items: StringItem[] | undefined) {
  return (items || [])
    .map((item) => (typeof item === "string" ? item : item?.value))
    .filter((item): item is string => Boolean(item))
}

export function FounderBooking(props: FounderBookingProps) {
  const key = (path: string) => contentKey(props.id, path)
  const analyticsFormId = "founder_booking"
  const bookingUrl = process.env.NEXT_PUBLIC_BOOKING_URL ?? "https://cal.com/your-handle"
  const phoneNumber = process.env.NEXT_PUBLIC_PHONE ?? "+447438460437"
  const phoneDigits = phoneNumber.replace(/\D/g, "")
  const whatsappMessage = props.whatsappMessage || ""
  const whatsappLink = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(whatsappMessage)}`
  const phoneLink = `tel:${phoneNumber}`
  const profileLight = props.profileImageLight
  const profileDark = props.profileImageDark || props.profileImageLight

  const contactOptions = normalizeItems(props.contactOptions)
  const resolvedContactOptions = contactOptions.length
    ? contactOptions
    : ["Video call", "Phone", "WhatsApp", "Email reply"]

  const [preferredContactMethod, setPreferredContactMethod] = useState(
    resolvedContactOptions[0] ?? "Video call",
  )

  const { formState, formMessage, handleSubmit, trackFormStart } = useContactForm({
    successMessage: props.formSuccessMessage || undefined,
    errorMessage: props.formErrorMessage || undefined,
    analyticsFormId,
  })

  const timelineItems = normalizeItems(props.timelineItems)
  const notes = normalizeItems(props.notes)

  const benefitIcons = useMemo(() => [Check, Zap, Shield, Timer], [])

  return (
    <Section id="booking" size="hero" maxWidth="6xl" className="bg-muted/20 pt-8 md:pt-10">
      <Card className="rounded-2xl border bg-card shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <div className="grid gap-8 md:grid-cols-[240px_1fr] md:items-start">
            <div className="space-y-3">
              <div className="overflow-hidden rounded-2xl bg-background shadow-sm ring-1 ring-border/60">
                <div className="relative aspect-square w-full">
                  <img
                    src={buildCdnImageUrl(profileLight, { width: 800, height: 800, fit: "cover" })}
                    alt={props.profileImageAlt}
                    className="absolute inset-0 h-full w-full object-cover dark:hidden"
                  />
                  <img
                    src={buildCdnImageUrl(profileDark, { width: 800, height: 800, fit: "cover" })}
                    alt={props.profileImageAlt}
                    className="absolute inset-0 hidden h-full w-full object-cover dark:block"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button asChild size="lg" className="justify-start rounded-full px-6">
                  <a
                    href={bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-analytics-event="booking_start"
                    data-analytics-category="contact"
                    data-analytics-label={props.primaryCtaLabel}
                    data-analytics-section="booking"
                  >
                    <Video className="mr-2 h-4 w-4" />
                    <EditableText
                      contentKey={key("booking.primaryCta")}
                      value={props.primaryCtaLabel}
                      as="span"
                      showIcon={false}
                    />
                  </a>
                </Button>
                <Button asChild variant="outline" className="justify-start rounded-full px-4">
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-analytics-event="whatsapp_click"
                    data-analytics-category="contact"
                    data-analytics-label={props.whatsappLabel}
                    data-analytics-section="booking"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    <EditableText
                      contentKey={key("booking.whatsappLabel")}
                      value={props.whatsappLabel}
                      as="span"
                      showIcon={false}
                    />
                  </a>
                </Button>
                <Button asChild variant="outline" className="justify-start rounded-full px-4">
                  <a
                    href={phoneLink}
                    data-analytics-event="phone_click"
                    data-analytics-category="contact"
                    data-analytics-label={props.phoneLabel}
                    data-analytics-section="booking"
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    <EditableText
                      contentKey={key("booking.phoneLabel")}
                      value={props.phoneLabel}
                      as="span"
                      showIcon={false}
                    />: {phoneNumber}
                  </a>
                </Button>
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">
                <EditableText contentKey={key("booking.tagline")} value={props.tagline} as="span" showIcon={false} />
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                <EditableText
                  contentKey={key("booking.headline")}
                  value={props.headline}
                  as="span"
                  multiline
                  showIcon={false}
                />
              </h2>
              <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
                <EditableText
                  contentKey={key("booking.intro")}
                  value={props.intro}
                  as="span"
                  multiline
                  showIcon={false}
                />
              </p>

              <ul className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                {(props.benefits || []).map((item, index) => {
                  const Icon = benefitIcons[index] ?? Check

                  return (
                    <li key={index} className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="font-medium text-foreground">
                          <EditableText
                            contentKey={key(`booking.benefits.${index}.lead`)}
                            value={item.lead}
                            as="span"
                            showIcon={false}
                          />
                        </span>
                        {item.detail ? (
                          <span className="text-muted-foreground">
                            {" "}
                            <EditableText
                              contentKey={key(`booking.benefits.${index}.detail`)}
                              value={item.detail}
                              as="span"
                              showIcon={false}
                            />
                          </span>
                        ) : null}
                      </span>
                    </li>
                  )
                })}
              </ul>

              <Separator className="my-7" />

              <p className="text-sm font-medium text-foreground">
                <EditableText
                  contentKey={key("booking.timelineHeading")}
                  value={props.timelineHeading}
                  as="span"
                  showIcon={false}
                />
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {timelineItems.map((item, index) => (
                  <div key={index} className="rounded-xl border bg-muted/30 p-4">
                    <p className="text-sm font-semibold text-foreground">
                      <EditableText
                        contentKey={key(`booking.timelineItems.${index}`)}
                        value={item}
                        as="span"
                        showIcon={false}
                      />
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3 text-sm text-muted-foreground">
                {notes.map((item, index) => (
                  <p key={index}>
                    <EditableText
                      contentKey={key(`booking.notes.${index}`)}
                      value={item}
                      as="span"
                      multiline
                      showIcon={false}
                    />
                  </p>
                ))}
              </div>

              <Card className="mt-8 rounded-2xl border bg-muted/30">
                <CardContent className="space-y-6 p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">
                        <EditableText contentKey={key("booking.heading")} value={props.heading} as="span" showIcon={false} />
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        <EditableText
                          contentKey={key("booking.subheading")}
                          value={props.subheading}
                          as="span"
                          multiline
                          showIcon={false}
                        />
                      </p>
                    </div>
                    <Button asChild size="lg" className="rounded-full px-6">
                      <a
                        href={bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-analytics-event="booking_start"
                        data-analytics-category="contact"
                        data-analytics-label={props.primaryCtaLabel}
                        data-analytics-section="booking"
                      >
                        <Phone className="mr-2 h-4 w-4" />
                        <EditableText
                          contentKey={key("booking.primaryCta")}
                          value={props.primaryCtaLabel}
                          as="span"
                          showIcon={false}
                        />
                      </a>
                    </Button>
                  </div>

                  <form
                    className="grid gap-4"
                    onSubmit={handleSubmit}
                    data-analytics-form={analyticsFormId}
                    onFocusCapture={trackFormStart}
                    onChangeCapture={trackFormStart}
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="contact-name">
                          <EditableText
                            contentKey={key("booking.formLabels.nameLabel")}
                            value={props.formLabels?.nameLabel || ""}
                            as="span"
                            showIcon={false}
                          />
                        </Label>
                        <Input id="contact-name" name="name" autoComplete="name" minLength={2} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact-email">
                          <EditableText
                            contentKey={key("booking.formLabels.emailLabel")}
                            value={props.formLabels?.emailLabel || ""}
                            as="span"
                            showIcon={false}
                          />
                        </Label>
                        <Input id="contact-email" name="email" type="email" autoComplete="email" required />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="contact-message">
                          <EditableText
                            contentKey={key("booking.formLabels.messageLabel")}
                            value={props.formLabels?.messageLabel || ""}
                            as="span"
                            showIcon={false}
                          />
                        </Label>
                        <Textarea
                          id="contact-message"
                          name="message"
                          minLength={10}
                          required
                          rows={4}
                          placeholder={props.formLabels?.messagePlaceholder || ""}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Accordion type="single" collapsible className="rounded-xl border border-border/70 px-4">
                          <AccordionItem value="optional" className="border-none">
                            <AccordionTrigger className="py-3 text-sm font-semibold text-foreground hover:no-underline">
                              <EditableText
                                contentKey={key("booking.formLabels.optionalDetailsLabel")}
                                value={props.formLabels?.optionalDetailsLabel || ""}
                                as="span"
                                showIcon={false}
                              />
                            </AccordionTrigger>
                            <AccordionContent className="pb-4">
                              <div className="grid gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="contact-telephone">
                                    <EditableText
                                      contentKey={key("booking.formLabels.telephoneLabel")}
                                      value={props.formLabels?.telephoneLabel || ""}
                                      as="span"
                                      showIcon={false}
                                    />
                                  </Label>
                                  <Input id="contact-telephone" name="telephone" type="tel" autoComplete="tel" />
                                </div>
                                <div className="space-y-2">
                                  <Label id="preferred-contact-label">
                                    <EditableText
                                      contentKey={key("booking.formLabels.preferredContactLabel")}
                                      value={props.formLabels?.preferredContactLabel || ""}
                                      as="span"
                                      showIcon={false}
                                    />
                                  </Label>
                                  <Tabs
                                    value={preferredContactMethod}
                                    onValueChange={(value) => setPreferredContactMethod(value)}
                                    className="w-full"
                                  >
                                    <TabsList
                                      className="h-auto w-full flex-wrap justify-start gap-2"
                                      aria-labelledby="preferred-contact-label"
                                    >
                                      {resolvedContactOptions.map((option) => (
                                        <TabsTrigger key={option} value={option} className="rounded-full px-4 py-2">
                                          {option}
                                        </TabsTrigger>
                                      ))}
                                    </TabsList>
                                  </Tabs>
                                  <input type="hidden" name="preferredContactMethod" value={preferredContactMethod} />
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    </div>
                    <input type="hidden" name="formId" value={analyticsFormId} />

                    <div className="sr-only" aria-hidden="true">
                      <Label htmlFor="contact-company">Company</Label>
                      <Input id="contact-company" name="company" tabIndex={-1} autoComplete="off" />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button type="submit" className="rounded-full px-6" disabled={formState === "submitting"}>
                        {formState === "submitting" ? (
                          <EditableText
                            contentKey={key("booking.formLabels.submittingLabel")}
                            value={props.formLabels?.submittingLabel || ""}
                            as="span"
                            showIcon={false}
                          />
                        ) : (
                          <EditableText
                            contentKey={key("booking.formLabels.submitLabel")}
                            value={props.formLabels?.submitLabel || ""}
                            as="span"
                            showIcon={false}
                          />
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        <EditableText
                          contentKey={key("booking.formLabels.privacyNotePrefix")}
                          value={props.formLabels?.privacyNotePrefix || ""}
                          as="span"
                          showIcon={false}
                        />{" "}
                        <Link href={props.privacyHref || "/privacy"} className="underline underline-offset-4">
                          <EditableText
                            contentKey={key("booking.formLabels.privacyNoteLinkLabel")}
                            value={props.formLabels?.privacyNoteLinkLabel || ""}
                            as="span"
                            showIcon={false}
                          />
                        </Link>
                        <EditableText
                          contentKey={key("booking.formLabels.privacyNoteSuffix")}
                          value={props.formLabels?.privacyNoteSuffix || ""}
                          as="span"
                          showIcon={false}
                        />
                      </p>
                      {formMessage ? (
                        <p className="text-sm text-muted-foreground" role="status" aria-live="polite" aria-atomic="true">
                          {formMessage}
                        </p>
                      ) : null}
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </Section>
  )
}

export const founderBookingConfig: ComponentConfig<FounderBookingProps> = {
  fields: {
    profileImageLight: { type: "text" },
    profileImageDark: { type: "text" },
    profileImageAlt: { type: "text" },
    primaryCtaLabel: { type: "text" },
    whatsappLabel: { type: "text" },
    phoneLabel: { type: "text" },
    tagline: { type: "text" },
    headline: { type: "text" },
    intro: { type: "textarea" },
    benefits: {
      type: "array",
      arrayFields: {
        lead: { type: "text" },
        detail: { type: "text" },
      },
    },
    timelineHeading: { type: "text" },
    timelineItems: { type: "array", arrayFields: { value: { type: "text" } } },
    notes: { type: "array", arrayFields: { value: { type: "text" } } },
    heading: { type: "text" },
    subheading: { type: "text" },
    formLabels: {
      type: "object",
      objectFields: {
        nameLabel: { type: "text" },
        emailLabel: { type: "text" },
        messageLabel: { type: "text" },
        messagePlaceholder: { type: "text" },
        optionalDetailsLabel: { type: "text" },
        telephoneLabel: { type: "text" },
        preferredContactLabel: { type: "text" },
        submitLabel: { type: "text" },
        submittingLabel: { type: "text" },
        privacyNotePrefix: { type: "text" },
        privacyNoteLinkLabel: { type: "text" },
        privacyNoteSuffix: { type: "text" },
      },
    },
    contactOptions: { type: "array", arrayFields: { value: { type: "text" } } },
    formSuccessMessage: { type: "text" },
    formErrorMessage: { type: "text" },
    privacyHref: { type: "text" },
    whatsappMessage: { type: "text" },
  },
  defaultProps: {
    profileImageLight: "",
    profileImageDark: "",
    profileImageAlt: "",
    primaryCtaLabel: "",
    whatsappLabel: "",
    phoneLabel: "",
    tagline: "",
    headline: "",
    intro: "",
    benefits: [],
    timelineHeading: "",
    timelineItems: [],
    notes: [],
    heading: "",
    subheading: "",
    formLabels: {
      nameLabel: "",
      emailLabel: "",
      messageLabel: "",
      messagePlaceholder: "",
      optionalDetailsLabel: "",
      telephoneLabel: "",
      preferredContactLabel: "",
      submitLabel: "",
      submittingLabel: "",
      privacyNotePrefix: "",
      privacyNoteLinkLabel: "",
      privacyNoteSuffix: "",
    },
    contactOptions: [],
    formSuccessMessage: "",
    formErrorMessage: "",
    privacyHref: "/privacy",
    whatsappMessage: "",
  },
  render: (props) => <FounderBooking {...props} />,
}
