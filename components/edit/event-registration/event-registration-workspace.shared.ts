export type EventRegistrationStatus = 'pending' | 'confirmed' | 'cancelled';
export type EventCampaignKind = 'update' | 'joining-instructions';
export type EventCampaignStatus = 'draft' | 'queued' | 'sending' | 'completed' | 'cancelled';
export type EventDeliveryStatus = 'pending' | 'sent' | 'failed' | 'skipped_unconfirmed';

export type EventWorkspaceItem = {
  id: string;
  slug: string;
  title: string;
  startDateTime: string | null;
  status: string;
  registrationMode: string;
  pendingCount: number;
  confirmedCount: number;
  cancelledCount: number;
  totalCount: number;
};

export type RegistrationItem = {
  id: string;
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  userId: string;
  email: string;
  fullName: string;
  firstName: string;
  status: EventRegistrationStatus;
  consentAt: string | null;
  confirmedAt: string | null;
  source: string;
  legalTextVersion: string;
  updatedAt: string | null;
  createdAt: string | null;
};

export type CampaignItem = {
  id: string;
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  campaignKind: EventCampaignKind;
  name: string;
  subject: string;
  preheader: string;
  htmlBody: string;
  textBody: string;
  visualBody: unknown[];
  status: EventCampaignStatus;
  scheduledAt: string | null;
  queuedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdByUserId: string;
  recipientSnapshotCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  lastError: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type DeliveryItem = {
  id: string;
  campaignId: string;
  eventId: string;
  registrationId: string;
  email: string;
  firstName: string;
  status: EventDeliveryStatus;
  postmarkMessageId: string;
  sentAt: string | null;
  error: string;
  attempts: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type OverviewPayload = {
  counts: {
    localEvents: number;
    pending: number;
    confirmed: number;
    cancelled: number;
  };
  campaignStatus: Record<EventCampaignStatus, number>;
  defaults: Record<EventCampaignKind, { htmlBody: string; textBody: string }>;
};

export type CampaignFormState = {
  campaignId: string;
  eventId: string;
  campaignKind: EventCampaignKind;
  name: string;
  subject: string;
  preheader: string;
  htmlBody: string;
  textBody: string;
  visualBody: unknown[];
  scheduledAt: string;
};

export const EMPTY_OVERVIEW: OverviewPayload = {
  counts: {
    localEvents: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0
  },
  campaignStatus: {
    draft: 0,
    queued: 0,
    sending: 0,
    completed: 0,
    cancelled: 0
  },
  defaults: {
    update: {
      htmlBody: '<p>Hi {{firstName}},</p><p>We wanted to share an update about <strong>{{eventTitle}}</strong>.</p><p>Please check the latest event details below.</p><p>Latest event details: <a href="{{eventUrl}}">{{eventUrl}}</a></p><p>Best,<br/>The team</p>',
      textBody: [
        'Hi {{firstName}},',
        '',
        'We wanted to share an update about {{eventTitle}}.',
        '',
        'Please check the latest event details below.',
        '',
        'Latest event details: {{eventUrl}}',
        '',
        'Best,',
        'The team'
      ].join('\n')
    },
    'joining-instructions': {
      htmlBody: '<p>Hi {{firstName}},</p><p>Here are the joining instructions for <strong>{{eventTitle}}</strong>.</p><p>{{joiningInstructions}}</p><p>Latest event details: <a href="{{eventUrl}}">{{eventUrl}}</a></p><p>Best,<br/>The team</p>',
      textBody: [
        'Hi {{firstName}},',
        '',
        'Here are the joining instructions for {{eventTitle}}.',
        '',
        '{{joiningInstructions}}',
        '',
        'Latest event details: {{eventUrl}}',
        '',
        'Best,',
        'The team'
      ].join('\n')
    }
  }
};

export function toDateTimeLocalInput(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function fromDateTimeLocalInput(value: string) {
  if (!value.trim()) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString();
}

export function formatDate(value: string | null) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString();
}

export function buildInitialForm(
  eventId: string,
  defaults: OverviewPayload['defaults'],
  campaignKind: EventCampaignKind = 'update'
): CampaignFormState {
  return {
    campaignId: '',
    eventId,
    campaignKind,
    name: campaignKind === 'joining-instructions' ? 'Joining instructions' : 'Event update',
    subject:
      campaignKind === 'joining-instructions'
        ? 'Joining instructions for {{eventTitle}}'
        : 'Important update for {{eventTitle}}',
    preheader:
      campaignKind === 'joining-instructions'
        ? 'Everything you need to join the event.'
        : 'A quick update for confirmed participants.',
    htmlBody: defaults[campaignKind].htmlBody,
    textBody: defaults[campaignKind].textBody,
    visualBody: [],
    scheduledAt: ''
  };
}
