import { assertServerOnly } from '@/lib/_server/guard'
assertServerOnly('models/Event.ts')

import { Schema, model, models } from 'mongoose'

import { EVENT_CATEGORIES, EVENT_LOCATION_TYPES, EVENT_REGISTRATION_MODES } from '@/lib/events'

const EventSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    startDateTime: { type: Date, required: true, index: true },
    endDateTime: { type: Date, required: true },
    locationType: {
      type: String,
      enum: EVENT_LOCATION_TYPES,
      default: 'in-person',
    },
    venueName: { type: String, default: '' },
    venueAddress: { type: String, default: '' },
    category: {
      type: String,
      enum: EVENT_CATEGORIES,
      default: 'Conference',
    },
    description: { type: String, default: '' },
    heroImage: { type: String, default: '/images/placeholder.svg' },
    registrationMode: {
      type: String,
      enum: EVENT_REGISTRATION_MODES,
      default: 'none',
    },
    ticketUrl: { type: String, default: '' },
    ticketPrice: { type: String, default: '' },
    registrationOpensAt: { type: Date, default: null },
    registrationClosesAt: { type: Date, default: null },
    joiningInstructions: { type: String, default: '' },
    isFree: { type: Boolean, default: true },
    organizer: { type: String, default: '' },
    createdByUserId: { type: String, default: null, index: true },
    primaryChapterSlug: { type: String, default: '' },
    chapterSlugs: {
      type: [String],
      default: [],
    },
    chapterSnapshot: {
      primaryChapterSlug: { type: String, default: '' },
      chapterSlugs: {
        type: [String],
        default: [],
      },
      capturedAt: { type: Date, default: null },
    },
    tags: {
      type: [String],
      default: [],
    },
    sourceUrl: { type: String, default: '' },
    sourceType: {
      type: String,
      enum: ['post', 'page', 'external', ''],
      default: '',
    },
    sourceId: { type: Number, default: null },
    sourceDate: { type: Date, default: null },
    sourceDateGmt: { type: Date, default: null },
    importedByName: { type: String, default: '' },
    importedByRole: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
      index: true,
    },
    featured: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
)

EventSchema.index({ status: 1, startDateTime: 1 })

export const Event = models.Event || model('Event', EventSchema)
