import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { EVENT_DELIVERY_STATUSES, normalizeEventDeliveryStatus } from '@/lib/event-registration/shared';
import { eventRegistrationDeliveryStatuses } from '@/models/EventRegistrationDelivery';
import { EventRegistrationCampaignList } from '@/components/edit/event-registration/event-registration-campaign-list';
import { EventRegistrationDeliveryLog } from '@/components/edit/event-registration/event-registration-delivery-log';
import type { CampaignItem, DeliveryItem } from '@/components/edit/event-registration/event-registration-workspace.shared';

// Not in ASAP, whose event campaign repair (September repair 3) is covered by the
// Mongo tests in tests/security/mail-integration.test.ts only. These check, without a
// database, what staff see of a delivery that is being sent or waits for review.
const campaign: CampaignItem = {
  id: 'campaign-1', eventId: 'event-1', eventSlug: 'spring-forum', eventTitle: 'Spring forum', campaignKind: 'update',
  name: 'Joining details', subject: 'Joining details', preheader: '', htmlBody: '<p>Hello</p>', textBody: 'Hello', visualBody: [],
  status: 'sending', scheduledAt: null, queuedAt: '2026-11-20T10:00:00.000Z', startedAt: '2026-11-20T10:01:00.000Z', completedAt: null,
  createdByUserId: 'staff-1', recipientSnapshotCount: 3, sentCount: 1, failedCount: 0, skippedCount: 0, needsReviewCount: 1,
  lastError: 'Delivery outcome needs review; check Postmark activity.', createdAt: '2026-11-20T09:00:00.000Z', updatedAt: '2026-11-20T10:02:00.000Z'
};
const delivery = (id: string, status: DeliveryItem['status']): DeliveryItem => ({
  id, campaignId: campaign.id, eventId: campaign.eventId, registrationId: `registration-${id}`, email: `${id}@example.test`,
  firstName: 'Alex', status, postmarkMessageId: '', sentAt: null, error: '', attempts: 1, createdAt: '2026-11-20T10:01:00.000Z', updatedAt: null
});

describe('event campaign deliveries waiting for a person', () => {
  test('a delivery being sent or waiting for review keeps that status', () => {
    for (const status of ['processing', 'needs_review'] as const) {
      expect(normalizeEventDeliveryStatus(status)).toBe(status);
      expect(EVENT_DELIVERY_STATUSES).toContain(status);
      expect(eventRegistrationDeliveryStatuses).toContain(status);
    }
    expect(normalizeEventDeliveryStatus('something-else')).toBe('pending');
  });

  test('the delivery log marks them, and the campaign says how many wait for review', () => {
    const log = renderToStaticMarkup(
      <EventRegistrationDeliveryLog items={[delivery('first', 'needs_review'), delivery('second', 'processing')]} campaigns={[campaign]} />
    );
    expect(log).toContain('Needs review');
    expect(log).toContain('Sending');
    expect(log).not.toContain('Skipped: Unconfirmed');
    const list = renderToStaticMarkup(
      <EventRegistrationCampaignList items={[campaign]} selectedCampaignId="" statusFilter="all" onSelect={() => {}} />
    );
    expect(list).toContain('Needs review: 1');
    expect(list).toContain('Delivery outcome needs review; check Postmark activity.');
  });
});
