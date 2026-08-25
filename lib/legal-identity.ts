// Registered company identity for Velvet Dinosaur.
//
// INCORPORATION SWITCH: Velvet Dinosaur Web Design Ltd is not registered yet.
// While COMPANY_REGISTERED is false the site must not claim to be a registered
// company, so the trading-name statement is withheld and contracts are made in
// Ian's own name. On incorporation: set COMPANY_REGISTERED to true, fill in
// COMPANY_NUMBER, rebuild, regenerate the agreement PDF and deploy — every
// surface (footer, agreement, emails, privacy, terms) follows from here.

// Typed as boolean, not the literal, so call sites keep both branches.
export const COMPANY_REGISTERED: boolean = false;

export const TRADING_NAME = 'Velvet Dinosaur';
export const REGISTERED_NAME = 'Velvet Dinosaur Web Design Ltd';
export const SOLE_TRADER_NAME = 'Ian Wickens';
export const COMPANY_NUMBER = '[NUMBER]';
export const REGISTERED_OFFICE =
  '16 Holloway Lane, Minster Lovell, Witney, Oxfordshire OX29 0AU, UK';

/**
 * One-line trading-name statement for the site footer and emails.
 * Null until incorporation — an unregistered business must not imply otherwise.
 */
export const TRADING_NAME_STATEMENT: string | null = COMPANY_REGISTERED
  ? `${TRADING_NAME} is a trading name of ${REGISTERED_NAME}, registered in England and Wales. Company number ${COMPANY_NUMBER}. Registered office: ${REGISTERED_OFFICE}.`
  : null;

/** Who the customer actually contracts with. */
export const CONTRACTING_PARTY: string = COMPANY_REGISTERED
  ? `${REGISTERED_NAME}, trading as ${TRADING_NAME}`
  : `${SOLE_TRADER_NAME}, trading as ${TRADING_NAME}`;

/** One-line details block for contract footers and formal documents. */
export const REGISTERED_DETAILS_LINE: string = COMPANY_REGISTERED
  ? `${CONTRACTING_PARTY} · Registered in England and Wales · Company number ${COMPANY_NUMBER} · Registered office: ${REGISTERED_OFFICE}`
  : `${CONTRACTING_PARTY} · ${REGISTERED_OFFICE}`;

/** Identity paragraph used by the privacy notice and terms page. */
export const LEGAL_IDENTITY_PARAGRAPH: string = COMPANY_REGISTERED
  ? `${REGISTERED_NAME}, trading as ${TRADING_NAME} (“Velvet Dinosaur”, “we”, “us”). Registered in England and Wales.\nCompany number ${COMPANY_NUMBER}\nRegistered office: ${REGISTERED_OFFICE}`
  : `${SOLE_TRADER_NAME}, trading as ${TRADING_NAME} (“Velvet Dinosaur”, “we”, “us”).\nBusiness address: ${REGISTERED_OFFICE}`;
