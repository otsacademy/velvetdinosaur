import type { SupportTicketThread, SupportWaitingOn } from '@/components/demo/support/demo-support.shared';

export type MessageType = 'requester' | 'staff' | 'automation';

const SUPPORT_TEAM_NAME = 'Velvet Dinosaur Support';

export function initials(value: string) {
  const parts = value
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return 'NA';
  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
}

export function statusBadgeClass(status: string) {
  if (status === 'resolved' || status === 'closed') {
    return 'border-border bg-muted text-muted-foreground';
  }
  if (status === 'open') {
    return 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
  }
  if (status === 'on_hold') {
    return 'border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300';
  }
  return 'border-sky-500/40 bg-sky-500/15 text-sky-700 dark:text-sky-300';
}

export function priorityBadgeClass(priority: string) {
  if (priority === '1-critical') {
    return 'border-destructive/40 bg-destructive/15 text-destructive';
  }
  if (priority === '2-high' || priority === '3-medium') {
    return 'border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300';
  }
  return 'border-border bg-muted text-muted-foreground';
}

export function waitingOnBadgeClass(waitingOn: SupportWaitingOn) {
  return waitingOn === 'customer'
    ? 'border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300'
    : 'border-primary/30 bg-primary/10 text-primary';
}

export function statusDescription(status: string) {
  const descriptions: Record<string, string> = {
    open: 'Received and queued for review.',
    in_progress: 'A support engineer is actively working this request.',
    monitor: 'A change is live and currently being monitored.',
    in_configuration: 'Preparing configuration before development begins.',
    on_hold: 'Temporarily paused, usually pending dependency or decision.',
    wish_list: 'Logged for future planning.',
    pre_development: 'Approved and waiting for development scheduling.',
    development_list: 'Added to the development queue.',
    report_new_update: 'Marked for update in next reporting cycle.',
    second_line_support: 'Escalated to second-line support.',
    uat: 'Awaiting acceptance testing.',
    setup: 'Setup and handover tasks are being completed.',
    future_release: 'Scheduled for a later release window.',
    onboarding: 'Onboarding tasks in progress.',
    resolved: 'Completed and awaiting final feedback.',
    closed: 'Formally closed.'
  };
  return descriptions[status] || 'Status is being updated.';
}

export function formatFileSize(value: number | null) {
  if (!value || value <= 0) return '';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function isAutomationFallback(message: SupportTicketThread['messages'][number]) {
  const signature = [message.authorUserId, message.authorEmail, message.authorName, message.bodyText].join(' ').toLowerCase();
  return /sync|automation|automated|bot|cron|daemon|smoke|test/i.test(signature);
}

export function resolveMessageType(message: SupportTicketThread['messages'][number]): MessageType {
  if (message.authorType === 'requester' || message.authorType === 'staff' || message.authorType === 'automation') {
    return message.authorType;
  }
  if (message.authorRole === 'admin-requester') return 'requester';
  if (message.authorRole === 'support-agent') return 'staff';
  return isAutomationFallback(message) ? 'automation' : 'staff';
}

export function resolveMessageName(message: SupportTicketThread['messages'][number], type: MessageType) {
  if (message.authorDisplayName?.trim()) return message.authorDisplayName.trim();
  if (message.authorName?.trim()) return message.authorName.trim();
  if (type === 'requester') return message.authorEmail || 'Customer';
  if (type === 'automation') return 'System Automation';
  return message.authorEmail || SUPPORT_TEAM_NAME;
}

export function resolveMessageAvatar(message: SupportTicketThread['messages'][number], type: MessageType) {
  if (type === 'automation') return '';
  if (message.authorAvatarUrl?.trim()) return message.authorAvatarUrl.trim();
  if (type === 'staff') return '/logo.webp';
  return '';
}

export function messageTone(type: MessageType) {
  if (type === 'requester') {
    return {
      bubble: 'rounded-2xl rounded-tl-sm border border-border/70 bg-muted/35',
      badge: 'border-border bg-muted text-muted-foreground',
      label: 'Requester'
    };
  }
  if (type === 'automation') {
    return {
      bubble: 'rounded-full border border-border/70 bg-muted/60 px-3 py-1.5 text-muted-foreground',
      badge: 'border-border bg-muted text-muted-foreground',
      label: 'Automation'
    };
  }
  return {
    bubble: 'rounded-2xl rounded-tr-sm border border-sidebar-primary/35 bg-sidebar-primary text-sidebar-primary-foreground shadow-sm',
    badge: 'border-sidebar-primary/35 bg-sidebar-primary/15 text-sidebar-primary',
    label: 'Support Team'
  };
}

export function ratingLabel(value: number) {
  if (value >= 5) return 'Very satisfied';
  if (value === 4) return 'Satisfied';
  if (value === 3) return 'Neutral';
  if (value === 2) return 'Unsatisfied';
  return 'Very unsatisfied';
}
