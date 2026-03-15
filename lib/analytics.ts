import { createAnalyticsLead, forwardAnalyticsEvent } from '@/lib/analytics/server';
import type { SiteAnalyticsEvent, SiteAnalyticsLead } from '@/lib/analytics/schema';

type AnalyticsMetadataValue = string | number | boolean | null;

export type { SiteAnalyticsEvent, SiteAnalyticsLead };
export { createAnalyticsLead, forwardAnalyticsEvent };

export async function trackServerConversion(
  request: Request,
  input: {
    conversionName: string;
    conversionValue?: number;
    eventName?: string;
    eventCategory?: string;
    sectionId?: string;
    ctaLabel?: string;
    ctaPosition?: string;
    formId?: string;
    entityType?: string;
    entityId?: string;
    leadId?: string;
    outcomeId?: string;
    currency?: string;
    value?: number;
    metadata?: Record<string, AnalyticsMetadataValue>;
  }
) {
  return forwardAnalyticsEvent(request, {
    eventType: 'conversion',
    eventName: input.eventName || input.conversionName,
    eventCategory: input.eventCategory || 'conversion',
    sectionId: input.sectionId,
    ctaLabel: input.ctaLabel,
    ctaPosition: input.ctaPosition,
    formId: input.formId,
    entityType: input.entityType,
    entityId: input.entityId,
    leadId: input.leadId,
    outcomeId: input.outcomeId,
    conversionName: input.conversionName,
    conversionValue: input.conversionValue,
    currency: input.currency,
    value: input.value,
    metadata: input.metadata
  });
}
