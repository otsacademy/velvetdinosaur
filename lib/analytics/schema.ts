import { z } from 'zod';

const metadataValueSchema = z.union([z.string().max(500), z.number().finite(), z.boolean(), z.null()]);
const stringField = (max: number) => z.string().trim().max(max);

export const AnalyticsTouchSchema = z.object({
  path: stringField(2000).optional(),
  referrer: stringField(2000).optional(),
  referrerDomain: stringField(240).optional(),
  source: stringField(120).optional(),
  medium: stringField(120).optional(),
  campaign: stringField(200).optional(),
  term: stringField(200).optional(),
  content: stringField(200).optional(),
  occurredAt: z.string().datetime().optional()
});

export const SiteAnalyticsEventSchema = z.object({
  eventType: z.enum(['page_view', 'engagement', 'conversion', 'lead', 'outcome']),
  eventName: stringField(120).optional(),
  eventCategory: stringField(80).optional(),
  occurredAt: z.string().datetime().optional(),
  visitorId: stringField(120).optional(),
  sessionId: stringField(120).optional(),
  path: stringField(2000).optional(),
  landingPath: stringField(2000).optional(),
  title: stringField(300).optional(),
  referrer: stringField(2000).optional(),
  language: stringField(40).optional(),
  utmSource: stringField(120).optional(),
  utmMedium: stringField(120).optional(),
  utmCampaign: stringField(200).optional(),
  utmTerm: stringField(200).optional(),
  utmContent: stringField(200).optional(),
  firstTouch: AnalyticsTouchSchema.optional(),
  lastTouch: AnalyticsTouchSchema.optional(),
  sectionId: stringField(120).optional(),
  ctaLabel: stringField(200).optional(),
  ctaPosition: stringField(80).optional(),
  formId: stringField(120).optional(),
  entityType: stringField(120).optional(),
  entityId: stringField(160).optional(),
  leadId: stringField(160).optional(),
  outcomeId: stringField(160).optional(),
  conversionName: stringField(120).optional(),
  conversionValue: z.number().finite().optional(),
  currency: stringField(16).optional(),
  value: z.number().finite().optional(),
  metadata: z.record(z.string().trim().min(1).max(80), metadataValueSchema).optional()
});

const AnalyticsContactSchema = z.object({
  name: stringField(160).optional(),
  email: stringField(240).optional(),
  phone: stringField(80).optional(),
  company: stringField(160).optional()
});

export const SiteAnalyticsLeadSchema = z.object({
  leadId: stringField(160).optional(),
  leadType: stringField(120).optional(),
  leadName: stringField(160).optional(),
  sourceRoute: stringField(200).optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost', 'spam']).optional(),
  occurredAt: z.string().datetime().optional(),
  visitorId: stringField(120).optional(),
  sessionId: stringField(120).optional(),
  path: stringField(2000).optional(),
  landingPath: stringField(2000).optional(),
  title: stringField(300).optional(),
  referrer: stringField(2000).optional(),
  language: stringField(40).optional(),
  contact: AnalyticsContactSchema.optional(),
  topic: stringField(160).optional(),
  budgetBand: stringField(160).optional(),
  timeline: stringField(160).optional(),
  serviceInterest: stringField(200).optional(),
  currentSiteUrl: stringField(500).optional(),
  howHeardAboutUs: stringField(200).optional(),
  messagePreview: stringField(1000).optional(),
  firstTouch: AnalyticsTouchSchema.optional(),
  lastTouch: AnalyticsTouchSchema.optional(),
  currency: stringField(16).optional(),
  value: z.number().finite().optional(),
  metadata: z.record(z.string().trim().min(1).max(80), metadataValueSchema).optional()
});

export type AnalyticsTouchSnapshot = z.infer<typeof AnalyticsTouchSchema>;
export type SiteAnalyticsEvent = z.infer<typeof SiteAnalyticsEventSchema>;
export type SiteAnalyticsLead = z.infer<typeof SiteAnalyticsLeadSchema>;
