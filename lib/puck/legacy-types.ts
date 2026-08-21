export const LEGACY_PAGE_TYPES = [
  'AsapAboutPage',
  'AsapAdvisoryBoardPage',
  'AsapBoardPage',
  'AsapConnectPage',
  'AsapEventsPage',
  'AsapFellowshipPage',
  'AsapHomePage',
  'AsapNewsPage',
  'AsapOurWorkEcologicalImpactFundPage',
  'AsapOurWorkHealthImpactFundPage',
  'AsapOurWorkImpactPage',
  'AsapOurWorkJournalPage',
  'AsapOurWorkPage',
  'AsapOurWorkResearchPage',
  'AsapTeamPage'
] as const;

export type AsapLegacyType = (typeof LEGACY_PAGE_TYPES)[number];
