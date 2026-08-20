export const SUPPORT_WAITING_ON = ['support', 'customer'] as const;
export type SupportWaitingOn = (typeof SUPPORT_WAITING_ON)[number];

export const SUPPORT_PRIORITIES = [
  '1-critical',
  '2-high',
  '3-medium',
  '4-low',
  '5-standard'
] as const;
export type SupportPriority = (typeof SUPPORT_PRIORITIES)[number];

export const SUPPORT_TICKET_OPEN_STATUSES = [
  'open',
  'in_progress',
  'monitor',
  'in_configuration',
  'on_hold',
  'wish_list',
  'pre_development',
  'development_list',
  'report_new_update',
  'second_line_support',
  'uat',
  'setup',
  'future_release',
  'onboarding'
] as const;

export const SUPPORT_TICKET_CLOSED_STATUSES = ['resolved', 'closed'] as const;

export const SUPPORT_TICKET_STATUSES = [
  ...SUPPORT_TICKET_OPEN_STATUSES,
  ...SUPPORT_TICKET_CLOSED_STATUSES
] as const;

export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number];

export const SUPPORT_TICKET_CATEGORIES = [
  {
    key: 'support_request',
    label: 'General Support',
    description: 'I have a question or need help with something.',
    customerVisible: true
  },
  {
    key: 'content_update',
    label: 'Content Update',
    description: 'I need text, images, or information changed on the website.',
    customerVisible: true
  },
  {
    key: 'technical_issue',
    label: 'Technical Issue',
    description: "Something isn't working properly or looks broken.",
    customerVisible: true
  },
  {
    key: 'feature_request',
    label: 'Feature Request',
    description: "I'd like something new added to the website (this may require a quote).",
    customerVisible: true
  },
  {
    key: 'access_permissions',
    label: 'Access & Permissions',
    description: 'Login, role, and account access support.',
    customerVisible: false
  }
] as const;

export type SupportTicketCategory = (typeof SUPPORT_TICKET_CATEGORIES)[number]['key'];

export const SUPPORT_TICKET_MODULES = [
  { key: 'homepage', label: 'Homepage' },
  { key: 'about_pages', label: 'About Us pages' },
  { key: 'news_articles', label: 'News Articles' },
  { key: 'events', label: 'Events' },
  { key: 'other', label: "Other / I'm not sure" }
] as const;

export type SupportTicketModule = (typeof SUPPORT_TICKET_MODULES)[number]['key'];

const CATEGORY_LABEL_BY_KEY = new Map(
  SUPPORT_TICKET_CATEGORIES.map((item) => [item.key, item.label])
);

const MODULE_LABEL_BY_KEY = new Map(
  SUPPORT_TICKET_MODULES.map((item) => [item.key, item.label])
);

const LEGACY_MODULE_LABEL_BY_KEY = new Map<string, string>([
  ['inbox', 'Inbox'],
  ['calendar', 'Calendar'],
  ['newsletter', 'Newsletter'],
  ['pages', 'Pages'],
  ['media_library', 'Media Library'],
  ['forms', 'Forms'],
  ['account', 'Account']
]);

const STATUS_LABEL_BY_KEY = new Map<SupportTicketStatus, string>([
  ['open', 'Open'],
  ['in_progress', 'In Progress'],
  ['monitor', 'Monitor'],
  ['in_configuration', 'In Configuration'],
  ['on_hold', 'On Hold'],
  ['wish_list', 'Wish List'],
  ['pre_development', 'Pre Development'],
  ['development_list', 'Development List'],
  ['report_new_update', 'New/Update to Report'],
  ['second_line_support', '2nd Line Support'],
  ['uat', 'UAT'],
  ['setup', 'Setup'],
  ['future_release', 'Future Release'],
  ['onboarding', 'Onboarding'],
  ['resolved', 'Resolved'],
  ['closed', 'Closed']
]);

const PRIORITY_LABEL_BY_KEY = new Map<SupportPriority, string>([
  ['1-critical', 'Urgent'],
  ['2-high', 'Soon'],
  ['3-medium', 'Soon'],
  ['4-low', 'When you can'],
  ['5-standard', 'When you can']
]);

const WAITING_ON_LABEL_BY_KEY = new Map<SupportWaitingOn, string>([
  ['support', "We're working on this"],
  ['customer', 'Needs your response']
]);

export function isSupportTicketStatus(value: unknown): value is SupportTicketStatus {
  return SUPPORT_TICKET_STATUSES.includes(value as SupportTicketStatus);
}

export function isSupportTicketCategory(value: unknown): value is SupportTicketCategory {
  return SUPPORT_TICKET_CATEGORIES.some((item) => item.key === value);
}

export function isSupportTicketModule(value: unknown): value is SupportTicketModule {
  return SUPPORT_TICKET_MODULES.some((item) => item.key === value);
}

export function isSupportPriority(value: unknown): value is SupportPriority {
  return SUPPORT_PRIORITIES.includes(value as SupportPriority);
}

export function isSupportWaitingOn(value: unknown): value is SupportWaitingOn {
  return SUPPORT_WAITING_ON.includes(value as SupportWaitingOn);
}

export function supportStatusIsOpen(status: SupportTicketStatus) {
  return SUPPORT_TICKET_OPEN_STATUSES.includes(status as (typeof SUPPORT_TICKET_OPEN_STATUSES)[number]);
}

export function supportCategoryLabel(category: SupportTicketCategory | string) {
  return CATEGORY_LABEL_BY_KEY.get(category as SupportTicketCategory) || 'General Support';
}

export function supportStatusLabel(status: SupportTicketStatus | string) {
  return STATUS_LABEL_BY_KEY.get(status as SupportTicketStatus) || 'Open';
}

export function supportPriorityLabel(priority: SupportPriority | string) {
  return PRIORITY_LABEL_BY_KEY.get(priority as SupportPriority) || 'When you can';
}

export function supportModuleLabel(module: string) {
  return (
    MODULE_LABEL_BY_KEY.get(module as SupportTicketModule) ||
    LEGACY_MODULE_LABEL_BY_KEY.get(module) ||
    "Other / I'm not sure"
  );
}

export function supportWaitingOnLabel(waitingOn: SupportWaitingOn | string) {
  return WAITING_ON_LABEL_BY_KEY.get(waitingOn as SupportWaitingOn) || "We're working on this";
}
