export type InboxMailbox = 'all' | 'inbox' | 'sent' | 'drafts' | 'snoozed' | 'archive' | 'trash';

export type MailItem = {
  id: string;
  mailbox: InboxMailbox;
  messageType: 'email';
  threadId: string | null;
  snoozedUntil?: string | null;
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
  snoozed: number;
  archive: number;
  trash: number;
  unread: number;
  starred: number;
};

export type ComposeDraft = {
  to: string;
  subject: string;
  message: string;
  threadId?: string;
};

export const EMPTY_COUNTS: MailboxCounts = {
  all: 0,
  inbox: 0,
  sent: 0,
  drafts: 0,
  snoozed: 0,
  archive: 0,
  trash: 0,
  unread: 0,
  starred: 0
};

export function formatReceivedAt(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

export async function readJson(response: Response) {
  return response.json().catch(() => ({}));
}
