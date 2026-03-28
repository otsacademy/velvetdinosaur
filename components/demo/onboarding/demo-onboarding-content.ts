import type { LucideIcon } from 'lucide-react';
import {
  BedDouble,
  Braces,
  CalendarDays,
  Clock3,
  Database,
  FilePenLine,
  FolderTree,
  Image,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  Link2,
  Mail,
  MessageSquare,
  Palette,
  PenLine,
  Reply,
  Route as RouteIcon,
  Search,
  Send,
  Settings2,
  SlidersHorizontal,
  Users,
} from 'lucide-react';

export type DemoOnboardingPageKey =
  | 'pages'
  | 'news'
  | 'contact-templates'
  | 'newsletter'
  | 'reviews'
  | 'stays'
  | 'routes'
  | 'bookings'
  | 'inbox'
  | 'calendar'
  | 'media'
  | 'theme'
  | 'support';

export type DemoOnboardingStep = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export type DemoOnboardingGuide = {
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
  steps: DemoOnboardingStep[];
};

export const demoOnboardingContent: Record<DemoOnboardingPageKey, DemoOnboardingGuide> = {
  pages: {
    label: 'Page Editor',
    title: 'How the page editor demo works',
    description: 'This is the real editing workflow with fictional content, disposable uploads, and no permanent saves.',
    icon: LayoutDashboard,
    steps: [
      {
        id: 'canvas',
        title: 'Start in the page canvas',
        description: 'The demo opens on a seeded page so you can edit straight away or add new sections from the components dock.',
        icon: FilePenLine,
      },
      {
        id: 'properties',
        title: 'Edit blocks from the inspector',
        description: 'Select any block to change copy, buttons, images, layout settings, and visibility from the properties panel.',
        icon: SlidersHorizontal,
      },
      {
        id: 'theme',
        title: 'Adjust the whole site theme',
        description: 'Open the theme controls to change colour, contrast, and radius across the page without leaving the editor.',
        icon: Palette,
      },
      {
        id: 'save',
        title: 'Preview the real workflow safely',
        description: 'Uploads, previews, save, and publish behave like the live product, but every change resets when the demo session ends.',
        icon: Send,
      },
    ],
  },
  news: {
    label: 'Article Editor',
    title: 'How the article editor demo works',
    description: 'This mirrors the editorial workflow used on live projects, but the article, media, and publishing actions stay inside the sandbox.',
    icon: PenLine,
    steps: [
      {
        id: 'write',
        title: 'Write in the main canvas',
        description: 'Start with the title and body, then use the slash command or toolbars to structure the article.',
        icon: FilePenLine,
      },
      {
        id: 'media',
        title: 'Insert media and supporting blocks',
        description: 'Add images, video, files, tables, and formatting options just as you would in the live editor.',
        icon: Image,
      },
      {
        id: 'settings',
        title: 'Complete metadata and scheduling',
        description: 'Use the settings rail for slug, summary, tags, SEO, social cards, and publication timing.',
        icon: Settings2,
      },
      {
        id: 'publish',
        title: 'Preview and publish without risk',
        description: 'Preview, save, schedule, and publish all follow the real workflow, but nothing leaves this demo.',
        icon: Send,
      },
    ],
  },
  'contact-templates': {
    label: 'Contact Templates',
    title: 'How the contact templates demo works',
    description: 'Edit system emails with token-aware previews while keeping the default versions intact.',
    icon: Mail,
    steps: [
      {
        id: 'choose-template',
        title: 'Choose a system email',
        description: 'Switch between fictional enquiry, confirmation, and support templates from the template list.',
        icon: Mail,
      },
      {
        id: 'preview-tabs',
        title: 'Move between preview and source tabs',
        description: 'Use Preview to see sample token values, then switch to HTML or Plain text when you need to edit the output directly.',
        icon: Braces,
      },
      {
        id: 'tokens',
        title: 'Keep required tokens in place',
        description: 'Warnings show when placeholders are missing, so you can put the right tokens back before saving the draft.',
        icon: Settings2,
      },
      {
        id: 'draft-controls',
        title: 'Compare, restore, and reset',
        description: 'Save changes, restore the saved draft, or reset to default. Everything resets once the demo session is over.',
        icon: Send,
      },
    ],
  },
  newsletter: {
    label: 'Newsletter',
    title: 'How the newsletter demo works',
    description: 'Build campaigns visually, inspect the HTML and plain-text output, and walk through a safe dispatch flow.',
    icon: Mail,
    steps: [
      {
        id: 'campaigns',
        title: 'Choose a campaign or start a new draft',
        description: 'Select a seeded campaign from the list or open a fresh draft to see the full composer flow.',
        icon: Mail,
      },
      {
        id: 'compose',
        title: 'Edit the newsletter in multiple views',
        description: 'Write in the visual editor, then switch to HTML, Plain text, or Preview to check the final message.',
        icon: FilePenLine,
      },
      {
        id: 'audience',
        title: 'Review the audience and settings',
        description: 'Check subscribers, featured content, test-send details, and deliverability settings before queueing the campaign.',
        icon: Users,
      },
      {
        id: 'dispatch',
        title: 'Run a full demo dispatch',
        description: 'Save draft, queue the campaign, send a demo test, and inspect delivery logs. No live email is ever sent.',
        icon: Send,
      },
    ],
  },
  reviews: {
    label: 'Reviews',
    title: 'How the reviews demo works',
    description: 'Issue review links, collect comments, and track approval progress with fictional reviewers and pages.',
    icon: MessageSquare,
    steps: [
      {
        id: 'links',
        title: 'Start with review links',
        description: 'Each link represents a reviewer, a page path, and an expiry window for a given review round.',
        icon: Link2,
      },
      {
        id: 'create-link',
        title: 'Create and share a demo link',
        description: 'Use the form to create a new fake review link or copy the selected link to understand the hand-off flow.',
        icon: Mail,
      },
      {
        id: 'comments',
        title: 'Track comments through the feed',
        description: 'Add notes, resolve them, or reopen them while the dashboard updates the overall review progress.',
        icon: MessageSquare,
      },
      {
        id: 'status',
        title: 'Keep approvals local to the sandbox',
        description: 'Link status changes and comment updates behave like the live workflow, but no reviewer is ever contacted.',
        icon: Settings2,
      },
    ],
  },
  stays: {
    label: 'Stays',
    title: 'How the stays demo works',
    description: 'Manage a fictional stay inventory with pricing, capacity, imagery, and links back to the route planner.',
    icon: BedDouble,
    steps: [
      {
        id: 'inventory',
        title: 'Review the stay inventory',
        description: 'The main table shows seeded stay records, pricing, status, and route relationships at a glance.',
        icon: BedDouble,
      },
      {
        id: 'edit',
        title: 'Open a stay to edit the record',
        description: 'Use the stay editor to change summaries, rates, capacity, gallery images, and internal notes.',
        icon: FilePenLine,
      },
      {
        id: 'cross-links',
        title: 'Keep routes and stays connected',
        description: 'Linked route badges show how one stay record feeds the wider travel programme across the other demos.',
        icon: RouteIcon,
      },
      {
        id: 'session-only',
        title: 'Test changes without touching production',
        description: 'Add, update, or remove stays freely. The full inventory resets when the demo is refreshed.',
        icon: Send,
      },
    ],
  },
  routes: {
    label: 'Routes',
    title: 'How the routes demo works',
    description: 'Plan fictional programmes with linked stays, itinerary notes, pricing, and live-versus-draft status.',
    icon: RouteIcon,
    steps: [
      {
        id: 'overview',
        title: 'Start with the route list',
        description: 'The planner shows duration, linked stays, pricing, and current status for every seeded route.',
        icon: RouteIcon,
      },
      {
        id: 'edit-route',
        title: 'Open a route to edit the itinerary',
        description: 'Change the summary, itinerary steps, season, capacity, and pricing from the route editor.',
        icon: FilePenLine,
      },
      {
        id: 'linked-stays',
        title: 'Check stay relationships as you go',
        description: 'Each route can reference stays, making it easy to explain how the travel modules work together.',
        icon: BedDouble,
      },
      {
        id: 'sandbox',
        title: 'Keep planning changes disposable',
        description: 'Every save is local to this session, so you can explore the workflow without affecting a real programme.',
        icon: Send,
      },
    ],
  },
  bookings: {
    label: 'Booking API',
    title: 'How the Booking API demo works',
    description: 'Review synced inventory, move bookings through the pipeline, and simulate availability updates in one sandboxed workspace.',
    icon: Database,
    steps: [
      {
        id: 'catalog',
        title: 'Sync products from the catalog',
        description: 'The catalog shows which stay and route records are available to sync into the booking layer.',
        icon: Database,
      },
      {
        id: 'pipeline',
        title: 'Update live booking records',
        description: 'Use the pipeline tab to change booking status, provider references, and enquiry progress.',
        icon: Search,
      },
      {
        id: 'availability',
        title: 'Simulate availability changes',
        description: 'Load a date range for any inventory item, then block dates or change rates from the availability tab.',
        icon: CalendarDays,
      },
      {
        id: 'safe-sync',
        title: 'Keep every sync demo-only',
        description: 'Catalog syncs and availability saves update the sandbox state only, and a refresh clears the changes.',
        icon: Send,
      },
    ],
  },
  inbox: {
    label: 'Inbox',
    title: 'How the inbox demo works',
    description: 'Triage enquiries, read threads, and draft replies with the same operational flow used in live projects.',
    icon: Mail,
    steps: [
      {
        id: 'mailboxes',
        title: 'Choose the mailbox you need',
        description: 'Move between inbox, drafts, sent, archive, and trash to understand how leads and replies are organised.',
        icon: Inbox,
      },
      {
        id: 'filters',
        title: 'Narrow the thread list quickly',
        description: 'Use search, unread filters, stars, and tags before opening the message you want to action.',
        icon: Search,
      },
      {
        id: 'reply',
        title: 'Read, tag, and respond',
        description: 'Open a thread, then reply, star, archive, mark read, or schedule a follow-up from the detail panel.',
        icon: Reply,
      },
      {
        id: 'sandbox-mail',
        title: 'Keep every email in the sandbox',
        description: 'Composed emails, drafts, and status changes stay inside this demo and disappear when the session resets.',
        icon: Send,
      },
    ],
  },
  calendar: {
    label: 'Calendar',
    title: 'How the calendar demo works',
    description: 'Manage calls, launch reviews, and internal handovers with a date picker, event list, and editable forms.',
    icon: CalendarDays,
    steps: [
      {
        id: 'dates',
        title: 'Pick a day from the calendar',
        description: 'Selecting a date loads that day’s events and shows where activity is already scheduled.',
        icon: CalendarDays,
      },
      {
        id: 'event-list',
        title: 'Review the day’s schedule',
        description: 'Use the middle column to scan existing events, timing, attendees, and upcoming activity.',
        icon: Clock3,
      },
      {
        id: 'event-form',
        title: 'Create or edit events on the right',
        description: 'Add new events or update the selected item with attendees, location, notes, and duration.',
        icon: Users,
      },
      {
        id: 'calendar-save',
        title: 'Test scheduling without keeping it',
        description: 'Save and delete actions mirror the real workflow, but every event exists only in this sandbox.',
        icon: Send,
      },
    ],
  },
  media: {
    label: 'Media Library',
    title: 'How the media library demo works',
    description: 'Browse a seeded library, upload fresh files, and organise assets with the same media workflow used in the live editor.',
    icon: Image,
    steps: [
      {
        id: 'folders',
        title: 'Start with folders and filtering',
        description: 'Use the library filters to move between the seeded folders and understand how assets are organised.',
        icon: FolderTree,
      },
      {
        id: 'uploads',
        title: 'Upload files with useful metadata',
        description: 'Add files with names, captions, alt text, and folder assignment just as you would in the live workspace.',
        icon: Image,
      },
      {
        id: 'tidy',
        title: 'Edit metadata and keep things tidy',
        description: 'Open any asset to adjust metadata, move it between folders, or clean up the library structure.',
        icon: Settings2,
      },
      {
        id: 'library-resets',
        title: 'Keep uploads disposable',
        description: 'New assets preview immediately, but the whole library resets when you leave or refresh the demo.',
        icon: Send,
      },
    ],
  },
  theme: {
    label: 'Theme Editor',
    title: 'How the theme editor demo works',
    description: 'Shape the design system live with presets, token sliders, and light-versus-dark previews.',
    icon: Palette,
    steps: [
      {
        id: 'preset',
        title: 'Choose a preset mood first',
        description: 'Start from a preset palette, then refine the tokens to show how the system can move quickly.',
        icon: Palette,
      },
      {
        id: 'tokens',
        title: 'Tune the core design tokens',
        description: 'Use hue, chroma, contrast, and radius sliders to change the look and feel across the whole preview.',
        icon: SlidersHorizontal,
      },
      {
        id: 'mode',
        title: 'Check both light and dark states',
        description: 'Switch modes to see how the palette behaves across buttons, panels, and text combinations.',
        icon: CalendarDays,
      },
      {
        id: 'theme-sandbox',
        title: 'Keep theme experiments local',
        description: 'This mirrors the live theming flow, but the state only exists on this page and is never published.',
        icon: Send,
      },
    ],
  },
  support: {
    label: 'Support Portal',
    title: 'How the support portal demo works',
    description: 'Track requests, raise new tickets, and explore support tooling with a fictional client workspace.',
    icon: LifeBuoy,
    steps: [
      {
        id: 'queue',
        title: 'Start on the active request queue',
        description: 'Use My requests to see open tickets, queue filters, and the current support health at a glance.',
        icon: LifeBuoy,
      },
      {
        id: 'ticket-detail',
        title: 'Open a ticket to manage the thread',
        description: 'Read the conversation, send a reply, and update ownership or status from the ticket detail view.',
        icon: MessageSquare,
      },
      {
        id: 'new-tickets',
        title: 'Raise problems or feature requests',
        description: 'Use the request forms to create fresh demo tickets, then watch them appear in the queue.',
        icon: Mail,
      },
      {
        id: 'toolkit',
        title: 'Use the support toolkit for context',
        description: 'Docs, articles, system status, and development hours are all wired in with fictional data that resets on refresh.',
        icon: Search,
      },
    ],
  },
};
