export const ASAP_LEGACY_TYPES = [
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

export type AsapLegacyType = (typeof ASAP_LEGACY_TYPES)[number];
