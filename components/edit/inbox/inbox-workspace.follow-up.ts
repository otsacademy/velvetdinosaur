import { type MailItem } from '@/components/edit/inbox-workspace.shared';

type FollowUpPayload = {
  title: string;
  dateKey: string;
  time: string;
  durationMin: number;
  location: string;
  attendees: string[];
  notes: string;
};

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toClock(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function nextHalfHourSlot(date: Date) {
  const total = date.getHours() * 60 + date.getMinutes();
  return Math.ceil((total + 1) / 30) * 30;
}

export function buildFollowUpEvent(mail: MailItem): FollowUpPayload {
  const now = new Date();
  const slotMin = Math.min(nextHalfHourSlot(now), 23 * 60 + 30);
  const sender = mail.fromName.trim();
  const notes = [`From: ${mail.fromName} <${mail.fromEmail}>`, '', mail.body].join('\n');

  return {
    title: `Follow up: ${mail.subject}`,
    dateKey: toDateKey(now),
    time: toClock(slotMin),
    durationMin: 30,
    location: 'Workspace',
    attendees: sender ? [sender] : [],
    notes
  };
}
