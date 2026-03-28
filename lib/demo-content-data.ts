import type { PageRow, WorkArticleRow } from '@/components/edit/pages-index-types';

export const demoContentPages: PageRow[] = [
  {
    slug: 'stays',
    title: 'Stays landing',
    updatedAt: '2026-03-16T08:30:00.000Z',
    publishedAt: '2026-03-12T09:00:00.000Z',
    draftUpdatedAt: '2026-03-16T08:30:00.000Z'
  },
  {
    slug: 'stay-bracken-ridge',
    title: 'Bracken Ridge Cabin',
    updatedAt: '2026-03-15T12:15:00.000Z',
    publishedAt: '2026-03-11T10:00:00.000Z',
    draftUpdatedAt: '2026-03-15T12:15:00.000Z'
  },
  {
    slug: 'stay-lantern-cove',
    title: 'Lantern Cove Hideaway',
    updatedAt: '2026-03-14T07:45:00.000Z',
    publishedAt: '2026-03-10T07:30:00.000Z',
    draftUpdatedAt: '2026-03-14T07:45:00.000Z'
  },
  {
    slug: 'home',
    title: 'Home',
    updatedAt: '2026-03-18T15:10:00.000Z',
    publishedAt: '2026-03-13T11:00:00.000Z',
    draftUpdatedAt: '2026-03-18T15:10:00.000Z'
  },
  {
    slug: 'about',
    title: 'About',
    updatedAt: '2026-03-12T09:40:00.000Z',
    publishedAt: '2026-03-08T08:20:00.000Z',
    draftUpdatedAt: '2026-03-12T09:40:00.000Z'
  },
  {
    slug: 'contact',
    title: 'Contact',
    updatedAt: '2026-03-17T13:20:00.000Z',
    publishedAt: '2026-03-09T16:00:00.000Z',
    draftUpdatedAt: '2026-03-17T13:20:00.000Z'
  },
  {
    slug: 'services',
    title: 'Services',
    updatedAt: '2026-03-11T10:30:00.000Z',
    publishedAt: '2026-03-07T12:10:00.000Z',
    draftUpdatedAt: '2026-03-11T10:30:00.000Z'
  },
  {
    slug: 'contracts',
    title: 'Contracts',
    updatedAt: '2026-03-18T08:00:00.000Z',
    publishedAt: null,
    draftUpdatedAt: '2026-03-18T08:00:00.000Z'
  },
  {
    slug: 'privacy-policy',
    title: 'Privacy policy',
    updatedAt: '2026-03-05T09:30:00.000Z',
    publishedAt: '2026-03-05T09:30:00.000Z',
    draftUpdatedAt: '2026-03-05T09:30:00.000Z'
  },
  {
    slug: 'terms',
    title: 'Terms',
    updatedAt: '2026-03-06T14:45:00.000Z',
    publishedAt: '2026-03-06T14:45:00.000Z',
    draftUpdatedAt: '2026-03-06T14:45:00.000Z'
  }
];

export const demoContentWorkArticles: WorkArticleRow[] = [
  {
    slug: 'coast-path-retreat-launch',
    title: 'Coast Path Retreat Launch',
    tag: 'Travel',
    authorName: 'Ian Wickens',
    status: 'published',
    date: '2026-03-08T10:00:00.000Z',
    updatedAt: '2026-03-17T09:10:00.000Z',
    pendingPublishRequestedAt: null
  },
  {
    slug: 'forest-studio-rebrand',
    title: 'Forest Studio Rebrand',
    tag: 'Branding',
    authorName: 'Ian Wickens',
    status: 'scheduled',
    date: '2026-03-25T08:00:00.000Z',
    updatedAt: '2026-03-19T12:30:00.000Z',
    pendingPublishRequestedAt: null
  },
  {
    slug: 'summer-camp-booking-flow',
    title: 'Summer Camp Booking Flow',
    tag: 'Product',
    authorName: 'Ian Wickens',
    status: 'draft',
    date: '2026-03-20T15:30:00.000Z',
    updatedAt: '2026-03-20T15:30:00.000Z',
    pendingPublishRequestedAt: '2026-03-20T16:00:00.000Z'
  }
];
