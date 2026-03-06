'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderIcon, MailIcon, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

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
  title?: string;
  description?: string;
  faqTitle?: string;
  faqs?: FAQ[];
  whatsapp?: WhatsAppContact;
  className?: string;
  onSubmit?: (data: ContactFormData) => Promise<void>;
}

const Contact25 = ({
  title = 'How can we help?',
  description = 'Check our FAQ for quick answers or send us a message.',
  faqTitle = 'Frequently Asked Questions',
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
      question: 'Can I schedule a demo?',
      answer:
        'Absolutely! You can schedule a personalized demo through our website or by contacting our sales team directly. Demos typically last 30-45 minutes.',
    },
    {
      question: 'What information should I include in my message?',
      answer:
        'Please include your account email (if applicable), a detailed description of your question or issue, and any relevant screenshots or error messages.',
    },
  ],
  whatsapp,
  className,
  onSubmit,
}: Contact25Props) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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

  const handleFormSubmit = async (data: ContactFormData) => {
    try {
      if (onSubmit) {
        await onSubmit(data);
      } else {
        console.log('Form submitted:', data);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      setIsSubmitted(true);
      setShowSuccess(true);
      form.reset();
      setTimeout(() => setShowSuccess(false), 4500);
      setTimeout(() => setIsSubmitted(false), 5000);
    } catch {
      form.setError('root', {
        message: 'Something went wrong. Please try again.',
      });
    }
  };

  return (
    <section className={cn('py-32', className)}>
      <div className="container">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h1 className="vd-section-heading mb-4 text-4xl font-medium tracking-tight md:text-5xl">
              {title}
            </h1>
            <p className="text-muted-foreground">{description}</p>
          </div>

          <div className="space-y-12">
            <div>
              <div className="mb-6 flex items-center gap-2">
                <MessageCircle className="size-5 text-muted-foreground" />
                <h2 className="vd-section-heading text-lg font-medium">{faqTitle}</h2>
              </div>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="vd-faq-item">
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <div>
              <div className="mb-6 flex items-center gap-2">
                <MailIcon className="size-5 text-muted-foreground" />
                <h2 className="vd-section-heading text-lg font-medium">Contact form</h2>
              </div>
              {whatsapp?.href ? (
                <div className="mb-6 rounded-xl border border-border bg-card p-4">
                  <a
                    href={whatsapp.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    <MessageCircle className="size-4" />
                    {whatsapp.label || 'Message on WhatsApp'}
                  </a>
                  {whatsapp.helperText ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {whatsapp.helperText}
                    </p>
                  ) : null}
                </div>
              ) : null}
              <form
                onSubmit={form.handleSubmit(handleFormSubmit)}
                className="vd-contact-form flex flex-col gap-6 rounded-xl bg-muted/50 p-8"
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
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
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
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
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
                          placeholder="How can we help?"
                          rows={4}
                          className="bg-background"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  {form.formState.errors.root && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.root.message}
                    </p>
                  )}

                  <Button
                    size="lg"
                    className="w-full"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <LoaderIcon className="mr-2 size-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Message'
                    )}
                  </Button>
                </FieldGroup>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Contact25 };
