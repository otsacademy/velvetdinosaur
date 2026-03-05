"use client"

import type { ComponentConfig } from "@measured/puck"
import {
  AlertCircle,
  CheckCircle,
  Mail,
  MapPin,
  MessagesSquare,
  Phone,
} from "lucide-react"
import { useState } from "react"

import { ShadcnblocksContainer } from "@/components/blocks/store/shadcnblocks/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

type ContactIcon = "Mail" | "MessagesSquare" | "Phone" | "MapPin"

const ICON_MAP = {
  Mail,
  MessagesSquare,
  Phone,
  MapPin,
} as const

type ContactInfo = {
  icon: ContactIcon
  title: string
  description: string
  value: string
  href: string
  badge?: string
}

type FormField = {
  label: string
  placeholder: string
  required?: "true" | "false"
}

type OfficeHour = {
  label: string
  hours: string
}

type ContactDetail = {
  label: string
  value: string
}

export type ShadcnblocksContact6Props = {
  heading: string
  description: string
  contactInfo: ContactInfo[]
  formTitle: string
  formDescription: string
  fields: {
    firstName: FormField
    lastName: FormField
    email: FormField
    company: FormField
    message: FormField
  }
  termsLabel: string
  termsConnector: string
  termsLinks: { label: string; href: string }[]
  submitLabel: string
  sendingLabel: string
  successMessage: string
  errorMessage: string
  officeHoursTitle: string
  officeHours: OfficeHour[]
  contactDetailsTitle: string
  contactDetails: ContactDetail[]
}

export function ShadcnblocksContact6(props: ShadcnblocksContact6Props) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    message: "",
    agreeToTerms: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    await new Promise((resolve) => setTimeout(resolve, 2000))

    const success = Math.random() > 0.3
    setSubmitStatus(success ? "success" : "error")
    setIsSubmitting(false)

    if (success) {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        company: "",
        message: "",
        agreeToTerms: false,
      })
    }
  }

  const [termsPrimary, termsSecondary] = props.termsLinks

  return (
    <ShadcnblocksContainer>
      <section className="bg-background py-8">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="mb-16 text-center">
              <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                {props.heading}
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                {props.description}
              </p>
            </div>

            <div className="grid gap-12 lg:grid-cols-2">
              <div className="space-y-6">
                <div className="space-y-4">
                  {(props.contactInfo || []).map((info, index) => {
                    const Icon = ICON_MAP[info.icon] || Mail
                    return (
                      <Card key={`${info.title}-${index}`} className="border-0 bg-muted shadow-none">
                        <CardContent>
                          <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                              <Icon className="size-6 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-center gap-2">
                                <h3 className="font-semibold">{info.title}</h3>
                                {info.badge ? (
                                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                    {info.badge}
                                  </span>
                                ) : null}
                              </div>
                              <p className="mb-2 text-sm text-muted-foreground">
                                {info.description}
                              </p>
                              <a href={info.href} className="text-sm font-medium transition-colors hover:underline">
                                {info.value}
                              </a>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>

              <Card className="border-0 shadow-none">
                <CardHeader>
                  <CardTitle>{props.formTitle}</CardTitle>
                  <p className="text-sm text-muted-foreground">{props.formDescription}</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-sm font-medium">
                          {props.fields.firstName.label}
                        </Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                          placeholder={props.fields.firstName.placeholder}
                          required={props.fields.firstName.required !== "false"}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-sm font-medium">
                          {props.fields.lastName.label}
                        </Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange("lastName", e.target.value)}
                          placeholder={props.fields.lastName.placeholder}
                          required={props.fields.lastName.required !== "false"}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        {props.fields.email.label}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder={props.fields.email.placeholder}
                        required={props.fields.email.required !== "false"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-sm font-medium">
                        {props.fields.company.label}
                      </Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => handleInputChange("company", e.target.value)}
                        placeholder={props.fields.company.placeholder}
                        required={props.fields.company.required === "true"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-sm font-medium">
                        {props.fields.message.label}
                      </Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => handleInputChange("message", e.target.value)}
                        placeholder={props.fields.message.placeholder}
                        rows={4}
                        required={props.fields.message.required !== "false"}
                        className="resize-none"
                      />
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
                        required
                      />
                      <Label htmlFor="agreeToTerms" className="text-sm leading-relaxed text-muted-foreground">
                        {props.termsLabel}
                        {termsPrimary ? (
                          <a href={termsPrimary.href} className="font-medium text-foreground hover:underline">
                            {termsPrimary.label}
                          </a>
                        ) : null}
                        {props.termsConnector ? ` ${props.termsConnector} ` : " "}
                        {termsSecondary ? (
                          <a href={termsSecondary.href} className="font-medium text-foreground hover:underline">
                            {termsSecondary.label}
                          </a>
                        ) : null}
                      </Label>
                    </div>

                    {submitStatus === "success" ? (
                      <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 p-3">
                        <CheckCircle className="size-6 text-primary" />
                        <span className="text-sm font-medium text-foreground">
                          {props.successMessage}
                        </span>
                      </div>
                    ) : null}

                    {submitStatus === "error" ? (
                      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                        <AlertCircle className="size-6 text-destructive" />
                        <span className="text-sm font-medium text-foreground">
                          {props.errorMessage}
                        </span>
                      </div>
                    ) : null}

                    <Button type="submit" disabled={isSubmitting || !formData.agreeToTerms} className="w-full">
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="size-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          {props.sendingLabel}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">{props.submitLabel}</div>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="mt-12">
              <Separator className="mb-8" />
              <Card className="border-0 bg-muted shadow-none">
                <CardContent className="p-6">
                  <div className="grid gap-8 md:grid-cols-2">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">{props.officeHoursTitle}</h3>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {(props.officeHours || []).map((item, index) => (
                          <div key={`${item.label}-${index}`} className="flex justify-between">
                            <span>{item.label}</span>
                            <span>{item.hours}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">{props.contactDetailsTitle}</h3>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {(props.contactDetails || []).map((item, index) => (
                          <div key={`${item.label}-${index}`} className="flex justify-between">
                            <span>{item.label}</span>
                            <span>{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </ShadcnblocksContainer>
  )
}

export const shadcnblocksContact6Config: ComponentConfig<ShadcnblocksContact6Props> = {
  fields: {
    heading: { type: "text" },
    description: { type: "textarea" },
    contactInfo: {
      type: "array",
      arrayFields: {
        icon: {
          type: "select",
          options: [
            { label: "Mail", value: "Mail" },
            { label: "MessagesSquare", value: "MessagesSquare" },
            { label: "Phone", value: "Phone" },
            { label: "MapPin", value: "MapPin" },
          ],
        },
        title: { type: "text" },
        description: { type: "textarea" },
        value: { type: "text" },
        href: { type: "text" },
        badge: { type: "text" },
      },
    },
    formTitle: { type: "text" },
    formDescription: { type: "textarea" },
    fields: {
      type: "object",
      objectFields: {
        firstName: {
          type: "object",
          objectFields: {
            label: { type: "text" },
            placeholder: { type: "text" },
            required: {
              type: "select",
              options: [
                { label: "Required", value: "true" },
                { label: "Optional", value: "false" },
              ],
            },
          },
        },
        lastName: {
          type: "object",
          objectFields: {
            label: { type: "text" },
            placeholder: { type: "text" },
            required: {
              type: "select",
              options: [
                { label: "Required", value: "true" },
                { label: "Optional", value: "false" },
              ],
            },
          },
        },
        email: {
          type: "object",
          objectFields: {
            label: { type: "text" },
            placeholder: { type: "text" },
            required: {
              type: "select",
              options: [
                { label: "Required", value: "true" },
                { label: "Optional", value: "false" },
              ],
            },
          },
        },
        company: {
          type: "object",
          objectFields: {
            label: { type: "text" },
            placeholder: { type: "text" },
            required: {
              type: "select",
              options: [
                { label: "Optional", value: "false" },
                { label: "Required", value: "true" },
              ],
            },
          },
        },
        message: {
          type: "object",
          objectFields: {
            label: { type: "text" },
            placeholder: { type: "text" },
            required: {
              type: "select",
              options: [
                { label: "Required", value: "true" },
                { label: "Optional", value: "false" },
              ],
            },
          },
        },
      },
    },
    termsLabel: { type: "text" },
    termsConnector: { type: "text" },
    termsLinks: {
      type: "array",
      arrayFields: {
        label: { type: "text" },
        href: { type: "text" },
      },
    },
    submitLabel: { type: "text" },
    sendingLabel: { type: "text" },
    successMessage: { type: "text" },
    errorMessage: { type: "text" },
    officeHoursTitle: { type: "text" },
    officeHours: {
      type: "array",
      arrayFields: {
        label: { type: "text" },
        hours: { type: "text" },
      },
    },
    contactDetailsTitle: { type: "text" },
    contactDetails: {
      type: "array",
      arrayFields: {
        label: { type: "text" },
        value: { type: "text" },
      },
    },
  },
  defaultProps: {
    heading: "Contact Us",
    description:
      "Ready to start your next project? Our team is here to help you succeed. Reach out and let's discuss how we can bring your ideas to life.",
    contactInfo: [
      {
        icon: "Mail",
        title: "Email",
        description: "Get a response within 24 hours",
        value: "hello@company.com",
        href: "mailto:hello@company.com",
        badge: "Recommended",
      },
      {
        icon: "MessagesSquare",
        title: "Live Chat",
        description: "Instant support available now",
        value: "Start chatting",
        href: "#",
        badge: "Online",
      },
      {
        icon: "Phone",
        title: "Phone",
        description: "Mon-Fri, 9AM-6PM EST",
        value: "+1 (555) 123-4567",
        href: "tel:+15551234567",
      },
      {
        icon: "MapPin",
        title: "Office",
        description: "Schedule an in-person meeting",
        value: "123 Innovation St, Tech City",
        href: "#",
      },
    ],
    formTitle: "Send us a message",
    formDescription: "Fill out the form below and we'll get back to you within 24 hours.",
    fields: {
      firstName: { label: "First Name *", placeholder: "John", required: "true" },
      lastName: { label: "Last Name *", placeholder: "Doe", required: "true" },
      email: { label: "Email Address *", placeholder: "john@company.com", required: "true" },
      company: { label: "Company", placeholder: "Your Company", required: "false" },
      message: {
        label: "Message *",
        placeholder: "Tell us about your project, goals, or how we can help...",
        required: "true",
      },
    },
    termsLabel: "I agree to the ",
    termsConnector: "and",
    termsLinks: [
      { label: "Terms of Service", href: "#" },
      { label: "Privacy Policy", href: "#" },
    ],
    submitLabel: "Submit",
    sendingLabel: "Sending...",
    successMessage: "Message sent successfully!",
    errorMessage: "Something went wrong. Please try again.",
    officeHoursTitle: "Office Hours",
    officeHours: [
      { label: "Monday - Friday", hours: "9:00 AM - 6:00 PM EST" },
      { label: "Saturday", hours: "10:00 AM - 4:00 PM EST" },
      { label: "Sunday", hours: "Closed" },
    ],
    contactDetailsTitle: "Contact Information",
    contactDetails: [
      { label: "Email", value: "hello@company.com" },
      { label: "Phone", value: "+1 (555) 123-4567" },
      { label: "Address", value: "123 Innovation St, Tech City" },
    ],
  },
  render: (props) => <ShadcnblocksContact6 {...props} />,
}
