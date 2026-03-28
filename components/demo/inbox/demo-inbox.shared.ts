'use client';

import { Archive, FileText, Inbox, Mail, Send, Trash2, type LucideIcon } from 'lucide-react';

export type InboxMailbox = 'all' | 'inbox' | 'sent' | 'drafts' | 'archive' | 'trash';

export type MailItem = {
  id: string;
  mailbox: InboxMailbox;
  fromName: string;
  fromEmail: string;
  to: string[];
  subject: string;
  preview: string;
  body: string;
  receivedAt: string | null;
  isRead: boolean;
  isStarred: boolean;
  tags: string[];
};

export type MailboxCounts = {
  all: number;
  inbox: number;
  sent: number;
  drafts: number;
  archive: number;
  trash: number;
  unread: number;
  starred: number;
};

export type ComposeDraft = {
  to: string;
  subject: string;
  message: string;
};

export type MailboxOption = {
  key: InboxMailbox;
  label: string;
  icon: LucideIcon;
  countKey: keyof MailboxCounts;
};

export const MAILBOX_OPTIONS: MailboxOption[] = [
  { key: 'all', label: 'All mail', icon: Mail, countKey: 'all' },
  { key: 'inbox', label: 'Inbox', icon: Inbox, countKey: 'inbox' },
  { key: 'sent', label: 'Sent', icon: Send, countKey: 'sent' },
  { key: 'drafts', label: 'Drafts', icon: FileText, countKey: 'drafts' },
  { key: 'archive', label: 'Archive', icon: Archive, countKey: 'archive' },
  { key: 'trash', label: 'Trash', icon: Trash2, countKey: 'trash' }
];

export const EMPTY_COUNTS: MailboxCounts = {
  all: 0,
  inbox: 0,
  sent: 0,
  drafts: 0,
  archive: 0,
  trash: 0,
  unread: 0,
  starred: 0
};

const DEMO_SENT_FROM = {
  name: 'Sauro CMS Demo',
  email: 'hello@velvetdinosaur.com'
};

function previewFromBody(body: string) {
  return body.replace(/\s+/g, ' ').trim().slice(0, 96);
}

export function formatReceivedAt(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function deriveMailboxCounts(items: MailItem[]): MailboxCounts {
  const counts = { ...EMPTY_COUNTS };
  counts.all = items.length;
  for (const item of items) {
    counts[item.mailbox] += 1;
    if (!item.isRead) counts.unread += 1;
    if (item.isStarred) counts.starred += 1;
  }
  return counts;
}

export function createDemoInboxSeed(): MailItem[] {
  return [
    {
      id: 'harbour-pine-proposal',
      mailbox: 'inbox',
      fromName: 'Martha Jones',
      fromEmail: 'martha@harbour-pine-demo.co.uk',
      to: ['hello@velvetdinosaur.com'],
      subject: 'Could you rebuild our studio site before the autumn launch?',
      preview: 'We need calmer case-study pages, cleaner enquiries, and something the team can update without us relying on a developer for every change.',
      body: [
        'Hello,',
        '',
        'I run a small interiors practice called Harbour & Pine. We are relaunching in September and the current site is too static for the way we work now.',
        '',
        'We need calmer case-study pages, clearer enquiry handling, and something the team can update in-house after launch.',
        '',
        'Could you let me know whether that timing sounds realistic?'
      ].join('\n'),
      receivedAt: '2026-03-23T08:12:00.000Z',
      isRead: false,
      isStarred: true,
      tags: ['proposal', 'website']
    },
    {
      id: 'northline-cabins-ops',
      mailbox: 'inbox',
      fromName: 'Sam Carter',
      fromEmail: 'sam@northlinecabins.example',
      to: ['hello@velvetdinosaur.com'],
      subject: 'Booking confirmations are confusing on mobile',
      preview: 'A few guests have replied to say they were unsure whether the booking was complete, so I need us to tidy the message flow quickly.',
      body: [
        'Hi,',
        '',
        'A few guests have replied this morning to say the booking confirmation message is not very clear on mobile.',
        '',
        'Nothing appears to be broken, but the wording and button order are causing hesitation. Can we review it and tighten the flow before the weekend?'
      ].join('\n'),
      receivedAt: '2026-03-23T09:04:00.000Z',
      isRead: false,
      isStarred: false,
      tags: ['ops', 'action-needed']
    },
    {
      id: 'cinder-house-discovery',
      mailbox: 'inbox',
      fromName: 'Asha Malik',
      fromEmail: 'asha@cinderhouse.studio',
      to: ['hello@velvetdinosaur.com'],
      subject: 'Can enquiries and discovery calls live in one place?',
      preview: 'We are trying to avoid using a separate CRM and want the website inbox to be practical rather than decorative.',
      body: [
        'Hello,',
        '',
        'We are trying to avoid a separate CRM for a small team. The ideal setup would let us handle new enquiries, qualify them, and move them into discovery calls from the same workspace.',
        '',
        'Is that how your inbox and calendar setup is intended to work?'
      ].join('\n'),
      receivedAt: '2026-03-22T15:41:00.000Z',
      isRead: true,
      isStarred: false,
      tags: ['planning', 'qualified']
    },
    {
      id: 'morningside-sent',
      mailbox: 'sent',
      fromName: 'Sauro CMS Demo',
      fromEmail: DEMO_SENT_FROM.email,
      to: ['june@morningsidestay.example'],
      subject: 'Re: Need a simpler way to handle booking enquiries',
      preview: 'Thanks for sending this through. A shared inbox and call-booking flow should be enough for a team of your size.',
      body: [
        'Thanks for sending this through.',
        '',
        'A shared inbox plus a lightweight call-booking flow should be enough for a team of your size. I would suggest starting with the enquiry stages first, then adding the calendar rules once the team has used it for a week or two.',
        '',
        'If that sounds right, I can outline a practical first pass.'
      ].join('\n'),
      receivedAt: '2026-03-22T11:25:00.000Z',
      isRead: true,
      isStarred: false,
      tags: ['outbound']
    },
    {
      id: 'lumen-draft',
      mailbox: 'drafts',
      fromName: 'Sauro CMS Demo',
      fromEmail: DEMO_SENT_FROM.email,
      to: ['nora@lumenatelier.example'],
      subject: 'Draft: next steps for the content migration',
      preview: 'I have started outlining a migration plan and the practical handover bits the team asked about.',
      body: [
        'Hello Nora,',
        '',
        'I have started outlining a migration plan and the handover steps the team asked about.',
        '',
        'Before I send the full note, I want to tighten the section on image handling and editorial approvals.'
      ].join('\n'),
      receivedAt: '2026-03-21T16:18:00.000Z',
      isRead: true,
      isStarred: false,
      tags: ['draft']
    },
    {
      id: 'grove-archive',
      mailbox: 'archive',
      fromName: 'Leonie Price',
      fromEmail: 'leonie@grovehall.example',
      to: ['hello@velvetdinosaur.com'],
      subject: 'Final copy deck and launch checklist attached',
      preview: 'Everything for launch has now been signed off, so I think this can come out of the active queue.',
      body: [
        'Hi,',
        '',
        'Everything for launch has now been signed off, including the updated copy deck and the final checklist for redirects.',
        '',
        'I think this can come out of the active queue now.'
      ].join('\n'),
      receivedAt: '2026-03-20T10:02:00.000Z',
      isRead: true,
      isStarred: false,
      tags: ['handover']
    },
    {
      id: 'sycamore-trash',
      mailbox: 'trash',
      fromName: 'Robin Bell',
      fromEmail: 'robin@sycamore-market.example',
      to: ['hello@velvetdinosaur.com'],
      subject: 'Duplicate message about homepage wording',
      preview: 'This was a duplicate follow-up after the wording had already been approved.',
      body: [
        'Hello again,',
        '',
        'This was a duplicate follow-up after the homepage wording had already been approved on the main thread.',
        '',
        'No action needed.'
      ].join('\n'),
      receivedAt: '2026-03-19T14:36:00.000Z',
      isRead: true,
      isStarred: false,
      tags: ['duplicate']
    }
  ];
}

export function createDemoOutboundMessage(input: ComposeDraft, action: 'send' | 'draft'): MailItem {
  const to = input.to
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const timestamp = new Date().toISOString();
  return {
    id: `${action}-${Date.now()}`,
    mailbox: action === 'send' ? 'sent' : 'drafts',
    fromName: DEMO_SENT_FROM.name,
    fromEmail: DEMO_SENT_FROM.email,
    to,
    subject: input.subject.trim(),
    preview: previewFromBody(input.message),
    body: input.message.trim(),
    receivedAt: timestamp,
    isRead: true,
    isStarred: false,
    tags: action === 'send' ? ['outbound'] : ['draft']
  };
}
