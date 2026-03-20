import { assertServerOnly } from '@/lib/_server/guard'
assertServerOnly('models/UserProfile.ts')

import { Schema, model, models } from 'mongoose'

const UserProfileSchema = new Schema(
  {
    userId: { type: String, required: true, index: true, unique: true },
    displayName: { type: String, default: '' },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    academicTitle: { type: String, default: '' },
    primaryChapterSlug: { type: String, default: '' },
    chapterSlugs: { type: [String], default: [] },
    institution: { type: String, default: '' },
    department: { type: String, default: '' },
    country: { type: String, default: '' },
    location: { type: String, default: '' },
    bio: { type: String, default: '' },
    orcidId: { type: String, default: '' },
    orcidUrl: { type: String, default: '' },
    scholarId: { type: String, default: '' },
    scholarUrl: { type: String, default: '' },
  },
  { timestamps: true },
)

export const UserProfile = models.UserProfile || model('UserProfile', UserProfileSchema)
