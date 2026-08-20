import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/event-registration/default-campaign-template.ts');

import { normalizeEventCampaignKind, type EventCampaignKind } from '@/lib/event-registration/shared';

export type EventCampaignTemplateContent = {
  htmlBody: string;
  textBody: string;
};

const UPDATE_TEMPLATE: EventCampaignTemplateContent = {
  htmlBody: [
    '<p>Hi {{firstName}},</p>',
    '<p>We wanted to share an update about <strong>{{eventTitle}}</strong>.</p>',
    '<p>{{customMessage}}</p>',
    '<p>You can review the latest event details here: <a href="{{eventUrl}}">{{eventUrl}}</a></p>',
    '<p>Best,<br/>The ASAP Global Team</p>'
  ].join(''),
  textBody: [
    'Hi {{firstName}},',
    '',
    'We wanted to share an update about {{eventTitle}}.',
    '',
    '{{customMessage}}',
    '',
    'Latest event details: {{eventUrl}}',
    '',
    'Best,',
    'The ASAP Global Team'
  ].join('\n')
};

const JOINING_TEMPLATE: EventCampaignTemplateContent = {
  htmlBody: [
    '<p>Hi {{firstName}},</p>',
    '<p>Here are the joining instructions for <strong>{{eventTitle}}</strong>.</p>',
    '<p>{{joiningInstructions}}</p>',
    '<p>You can review the latest event details here: <a href="{{eventUrl}}">{{eventUrl}}</a></p>',
    '<p>Best,<br/>The ASAP Global Team</p>'
  ].join(''),
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
    'The ASAP Global Team'
  ].join('\n')
};

export function buildDefaultEventCampaignTemplateContent(kind: EventCampaignKind): EventCampaignTemplateContent {
  return normalizeEventCampaignKind(kind) === 'joining-instructions'
    ? { ...JOINING_TEMPLATE }
    : { ...UPDATE_TEMPLATE };
}
