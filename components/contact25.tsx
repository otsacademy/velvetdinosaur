'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Clock3, LoaderIcon, MailIcon, MessageCircle, Star } from 'lucide-react';
import { type ReactNode, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { trackAnalyticsEvent } from '@/lib/analytics/client';
import { cn } from '@/lib/utils';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email'),
  message: z.string().min(1, 'Message is required'),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

interface FAQ {
  question: string;
  answer: string;
}

interface WhatsAppContact {
  href: string;
  label?: string;
  helperText?: string;
}

interface Contact25Props {
  sectionId?: string;
  title?: string;
  description?: string;
  faqTitle?: string;
  formTitle?: string;
  formDescription?: string;
  faqs?: FAQ[];
  detailsContent?: ReactNode;
  formContent?: ReactNode;
  whatsapp?: WhatsAppContact;
  className?: string;
  onSubmit?: (data: ContactFormData) => Promise<void>;
  analyticsFormId?: string;
  analyticsSectionId?: string;
}

const Contact25 = ({
  sectionId,
  title = 'How can we help?',
  description = 'Check our FAQ for quick answers or send us a message.',
  faqTitle = 'Frequently Asked Questions',
  formTitle = 'Project enquiry',
  formDescription = "You'll hear directly from Ian with clear next steps.",
  faqs = [
    {
      question: 'What are your business hours?',
      answer:
        'Our support team is available Monday through Friday, 9am to 6pm EST. For urgent matters outside these hours, please email urgent@company.com.',
    },
    {
      question: 'How long does it take to get a response?',
      answer:
        'We typically respond to all inquiries within 24 hours during business days. Complex requests may take up to 48 hours for a thorough response.',
    },
    {
      question: 'Do you offer phone support?',
      answer:
        'Yes, phone support is available for our Pro and Enterprise customers. You can find your dedicated support number in your account dashboard.',
    },
    {
      question: 'Can I book a call?',
      answer:
        'Yes. Use the form or WhatsApp and we can arrange a short call to discuss scope, timings, and whether the project is a good fit.',
    },
    {
      question: 'What information should I include in my message?',
      answer:
        'Please include your account email (if applicable), a detailed description of your question or issue, and any relevant screenshots or error messages.',
    },
  ],
  detailsContent,
  formContent,
  whatsapp,
  className,
  onSubmit,
  analyticsFormId = 'contact25',
  analyticsSectionId = 'contact',
}: Contact25Props) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const hasTrackedStartRef = useRef(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      name: '',
      email: '',
      message: '',
    },
  });

  const trackFormStart = () => {
    if (hasTrackedStartRef.current) return;
    hasTrackedStartRef.current = true;
    void trackAnalyticsEvent({
      eventType: 'engagement',
      eventName: 'form_start',
      eventCategory: 'form',
      formId: analyticsFormId,
      sectionId: analyticsSectionId,
    });
  };

  const handleFormSubmit = async (data: ContactFormData) => {
    try {
      trackFormStart();
      void trackAnalyticsEvent({
        eventType: 'engagement',
        eventName: 'form_submit',
        eventCategory: 'form',
        formId: analyticsFormId,
        sectionId: analyticsSectionId,
      });
      if (onSubmit) {
        await onSubmit(data);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      setIsSubmitted(true);
      setShowSuccess(true);
      form.reset();
      hasTrackedStartRef.current = false;
      void trackAnalyticsEvent({
        eventType: 'conversion',
        eventName: 'form_submit_success',
        eventCategory: 'form',
        formId: analyticsFormId,
        sectionId: analyticsSectionId,
        conversionName: 'contact_submit_success',
      });
      setTimeout(() => setShowSuccess(false), 4500);
      setTimeout(() => setIsSubmitted(false), 5000);
    } catch {
      form.setError('root', {
        message: 'Something went wrong. Please try again.',
      });
    }
  };

  return (
    <section
      id={sectionId}
      data-analytics-section={analyticsSectionId}
      className={cn('py-20', className)}
    >
      <div className="container">
        <div className="vd-surface-panel vd-soft-panel mx-auto max-w-6xl p-6 md:p-10">
          <div className="mb-10 max-w-3xl space-y-3">
            <p className="inline-flex rounded-full border border-[color-mix(in_oklch,var(--vd-border)_82%,transparent)] bg-background px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--vd-muted-fg)]">
              Let&apos;s build something valuable
            </p>
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            <p className="text-[var(--vd-copy)]">{description}</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="vd-surface-card border border-[color-mix(in_oklch,var(--vd-border)_82%,transparent)] bg-background/80 p-5 md:p-6">
              <div className="mb-6 flex items-center gap-2">
                <MessageCircle className="size-5 text-[var(--vd-muted-fg)]" />
                <h3 className="vd-section-heading text-lg font-medium">{faqTitle}</h3>
              </div>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="vd-faq-item border-b border-[color-mix(in_oklch,var(--vd-border)_72%,transparent)]"
                  >
                    <AccordionTrigger className="text-left text-base font-medium text-[var(--vd-fg)] hover:text-primary">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-[var(--vd-copy)]">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <div className="vd-surface-card border border-[color-mix(in_oklch,var(--vd-border)_82%,transparent)] bg-background/84 p-5 md:p-6">
              <div className="mb-4 flex items-center gap-2">
                <MailIcon className="size-5 text-[var(--vd-muted-fg)]" />
                <h3 className="vd-section-heading text-lg font-medium">{formTitle}</h3>
              </div>

              <p className="mb-4 text-sm text-[var(--vd-copy)]">{formDescription}</p>

              <div className="mb-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[color-mix(in_oklch,var(--vd-border)_72%,transparent)] bg-card p-3">
                  <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--vd-muted-fg)]">
                    <Star className="h-3.5 w-3.5 text-primary" />
                    Google rating
                  </p>
                  <p className="text-sm font-semibold text-foreground">5.0 average from clients</p>
                </div>
                <div className="rounded-xl border border-[color-mix(in_oklch,var(--vd-border)_72%,transparent)] bg-card p-3">
                  <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--vd-muted-fg)]">
                    <Clock3 className="h-3.5 w-3.5 text-primary" />
                    Typical response
                  </p>
                  <p className="text-sm font-semibold text-foreground">Within 1 business day</p>
                </div>
              </div>

              {whatsapp?.href ? (
                <div className="mb-5 rounded-xl border border-[color-mix(in_oklch,var(--vd-border)_72%,transparent)] bg-card p-4">
                  <a
                    href={whatsapp.href}
                    target="_blank"
                    rel="noreferrer"
                    data-analytics-event="whatsapp_click"
                    data-analytics-category="contact"
                    data-analytics-label={whatsapp.label || 'Message on WhatsApp'}
                    data-analytics-section={analyticsSectionId}
                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:text-primary"
                  >
                    <MessageCircle className="size-4" />
                    {whatsapp.label || 'Message on WhatsApp'}
                  </a>
                  {whatsapp.helperText ? (
                    <p className="mt-1 text-xs text-[var(--vd-muted-fg)]">{whatsapp.helperText}</p>
                  ) : null}
                </div>
              ) : null}

              {detailsContent ? <div className="mb-5 space-y-5">{detailsContent}</div> : null}

              {formContent ? (
                <div className="rounded-[calc(var(--vd-radius)+8px)] border border-[color-mix(in_oklch,var(--vd-border)_72%,transparent)] bg-background p-5">
                  {formContent}
                </div>
              ) : (
                <form
                  onSubmit={form.handleSubmit(handleFormSubmit)}
                  className="vd-contact-form flex flex-col gap-5 rounded-[calc(var(--vd-radius)+8px)] border border-[color-mix(in_oklch,var(--vd-border)_72%,transparent)] bg-background p-5"
                  data-analytics-form={analyticsFormId}
                >
                  {isSubmitted && (
                    <div
                      className={cn(
                        'rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-center transition-opacity duration-500',
                        showSuccess ? 'opacity-100' : 'opacity-0'
                      )}
                    >
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">
                        Thank you! We&apos;ll get back to you soon.
                      </p>
                    </div>
                  )}

                  <FieldGroup>
                    <Controller
                      control={form.control}
                      name="name"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={field.name}>
                            Name <span className="text-destructive">*</span>
                          </FieldLabel>
                          <Input
                            {...field}
                            id={field.name}
                            aria-invalid={fieldState.invalid}
                            placeholder="Your name"
                            className="bg-background"
                            onFocus={trackFormStart}
                            onChange={(event) => {
                              trackFormStart();
                              field.onChange(event);
                            }}
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    <Controller
                      control={form.control}
                      name="email"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={field.name}>
                            Email <span className="text-destructive">*</span>
                          </FieldLabel>
                          <Input
                            {...field}
                            id={field.name}
                            type="email"
                            aria-invalid={fieldState.invalid}
                            placeholder="you@example.com"
                            className="bg-background"
                            onFocus={trackFormStart}
                            onChange={(event) => {
                              trackFormStart();
                              field.onChange(event);
                            }}
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    <Controller
                      control={form.control}
                      name="message"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={field.name}>
                            Message <span className="text-destructive">*</span>
                          </FieldLabel>
                          <Textarea
                            {...field}
                            id={field.name}
                            aria-invalid={fieldState.invalid}
                            placeholder="Tell me what you need and where your current site is falling short."
                            rows={4}
                            className="bg-background"
                            onFocus={trackFormStart}
                            onChange={(event) => {
                              trackFormStart();
                              field.onChange(event);
                            }}
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    {form.formState.errors.root && (
                      <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
                    )}

                    <Button
                      size="lg"
                      className="vd-pill-primary h-12 w-full rounded-full text-[0.9375rem] font-medium hover:bg-[var(--vd-primary-solid-hover)]"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting ? (
                        <>
                          <LoaderIcon className="mr-2 size-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Start your project'
                      )}
                    </Button>
                  </FieldGroup>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Contact25 };
