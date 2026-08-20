import { Archive, Clock3, FileText, Inbox, Mail, Send, Trash2 } from 'lucide-react';
import { type ComposeDraft, type InboxMailbox, type MailItem, type MailboxCounts } from '@/components/edit/inbox-workspace.shared';

export const MESSAGE_MAILBOXES: Array<{
  key: InboxMailbox;
  label: string;
  icon: typeof Mail;
  countKey: keyof MailboxCounts;
}> = [
  { key: 'all', label: 'All mail', icon: Mail, countKey: 'all' },
  { key: 'inbox', label: 'Inbox', icon: Inbox, countKey: 'inbox' }
];

export const ORGANIZE_MAILBOXES: Array<{
  key: InboxMailbox;
  label: string;
  icon: typeof Mail;
  countKey: keyof MailboxCounts;
}> = [
  { key: 'drafts', label: 'Drafts', icon: FileText, countKey: 'drafts' },
  { key: 'sent', label: 'Sent', icon: Send, countKey: 'sent' },
  { key: 'snoozed', label: 'Snoozed', icon: Clock3, countKey: 'snoozed' },
  { key: 'archive', label: 'Archive', icon: Archive, countKey: 'archive' },
  { key: 'trash', label: 'Trash', icon: Trash2, countKey: 'trash' }
];

export const QUICK_TABS: Array<{ key: InboxMailbox; label: string; countKey: keyof MailboxCounts }> = [
  { key: 'inbox', label: 'Inbox', countKey: 'inbox' },
  { key: 'sent', label: 'Sent', countKey: 'sent' },
  { key: 'drafts', label: 'Drafts', countKey: 'drafts' },
  { key: 'snoozed', label: 'Snoozed', countKey: 'snoozed' },
  { key: 'trash', label: 'Trash', countKey: 'trash' }
];

export function resetComposeDraft(): ComposeDraft {
  return { to: '', subject: '', message: '', threadId: undefined };
}

export function senderInitials(mail: MailItem) {
  const from = (mail.fromName || mail.fromEmail || 'M').trim();
  if (!from) return 'M';
  const pieces = from.split(/\s+/).filter(Boolean);
  if (pieces.length === 1) return pieces[0].slice(0, 1).toUpperCase();
  return `${pieces[0].slice(0, 1)}${pieces[1].slice(0, 1)}`.toUpperCase();
}

export function toThreadKey(mail: MailItem) {
  if (mail.threadId) return `thread:${mail.threadId}`;
  const subject = mail.subject.trim().toLowerCase();
  const from = mail.fromEmail.trim().toLowerCase();
  return `fallback:${subject}::${from}`;
}

export function toDateValue(value: string | null | undefined) {
  if (!value) return 0;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}
