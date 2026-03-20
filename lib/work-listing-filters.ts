export type WorkListingCandidate = {
  slug?: string | null
  title?: string | null
}

export function shouldExcludeFromWorkListings(_candidate: WorkListingCandidate) {
  return false
}
