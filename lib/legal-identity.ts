// Registered company identity for Velvet Dinosaur.
//
// PLACEHOLDERS: COMPANY_NUMBER and REGISTERED_OFFICE must be filled in once
// Velvet Dinosaur Web Design Ltd is incorporated at Companies House. Until
// then the trading-name wording still reads correctly, but the placeholders
// are intentionally visible so they cannot be forgotten.

export const TRADING_NAME = 'Velvet Dinosaur';
export const REGISTERED_NAME = 'Velvet Dinosaur Web Design Ltd';
export const COMPANY_NUMBER = '[NUMBER]';
export const REGISTERED_OFFICE =
  '16 Holloway Lane, Minster Lovell, Witney, Oxfordshire OX29 0AU, UK';

/** One-line trading-name statement used in the site footer and emails. */
export const TRADING_NAME_STATEMENT =
  `${TRADING_NAME} is a trading name of ${REGISTERED_NAME}, registered in England and Wales. ` +
  `Company number ${COMPANY_NUMBER}. Registered office: ${REGISTERED_OFFICE}.`;

/** Formal parties clause opener for contracts. */
export const CONTRACTING_PARTY =
  `${REGISTERED_NAME}, trading as ${TRADING_NAME}`;

/** One-line registered-details block for contract footers and formal documents. */
export const REGISTERED_DETAILS_LINE =
  `${CONTRACTING_PARTY} · Registered in England and Wales · ` +
  `Company number ${COMPANY_NUMBER} · Registered office: ${REGISTERED_OFFICE}`;
