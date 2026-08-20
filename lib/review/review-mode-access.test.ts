import { describe, expect, it } from 'bun:test'

import { canManageReviewMode, reviewModeIsRestrictedInRuntime } from './review-mode-access'

describe('review mode access', () => {
  it('restricts live academicsstand.org runtime to Ian only', () => {
    expect(reviewModeIsRestrictedInRuntime('https://academicsstand.org/admin/review-links')).toBe(true)
    expect(canManageReviewMode('ian.wickens@ontourism.academy', 'https://academicsstand.org/admin/review-links')).toBe(
      true,
    )
    expect(canManageReviewMode('editor@example.org', 'https://academicsstand.org/admin/review-links')).toBe(false)
  })

  it('leaves non-production hosts available to other admins', () => {
    expect(reviewModeIsRestrictedInRuntime('https://staging.academicsstand.org/admin/review-links')).toBe(false)
    expect(canManageReviewMode('editor@example.org', 'https://staging.academicsstand.org/admin/review-links')).toBe(
      true,
    )
  })
})
