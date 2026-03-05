type ParsedName = {
  firstName: string;
  lastName: string;
};

export type NfcContactDetails = {
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  websiteUrl: string;
  mobile: string;
  whatsapp: string;
  whatsappDigits: string;
};

const DEFAULT_NAME = 'Ian Wickens';
const DEFAULT_EMAIL = 'hello@velvetinosaur.com';
const DEFAULT_WEBSITE_URL = 'https://velvetdinosaur.com';

function normalizeUrl(value: string, fallback: string) {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function normalizePhone(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const hasPlusPrefix = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  return hasPlusPrefix ? `+${digits}` : digits;
}

function parseName(fullName: string): ParsedName {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: 'Ian', lastName: 'Wickens' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ')
  };
}

function escapeVCardValue(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

export function getNfcContactDetails(): NfcContactDetails {
  const fullName = (process.env.NFC_CONTACT_NAME || DEFAULT_NAME).trim() || DEFAULT_NAME;
  const parsedName = parseName(fullName);
  const email = (process.env.NFC_CONTACT_EMAIL || DEFAULT_EMAIL).trim() || DEFAULT_EMAIL;
  const websiteUrl = normalizeUrl(
    process.env.NFC_CONTACT_WEBSITE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.VD_SITE_URL ||
      DEFAULT_WEBSITE_URL,
    DEFAULT_WEBSITE_URL
  );

  const mobile = normalizePhone(process.env.NFC_CONTACT_MOBILE || process.env.NEXT_PUBLIC_PHONE || '');
  const whatsappSource =
    process.env.NFC_CONTACT_WHATSAPP && process.env.NFC_CONTACT_WHATSAPP.trim().length > 0
      ? process.env.NFC_CONTACT_WHATSAPP
      : mobile;
  const whatsapp = normalizePhone(whatsappSource || '');
  const whatsappDigits = whatsapp.replace(/\D/g, '');

  return {
    fullName,
    firstName: parsedName.firstName,
    lastName: parsedName.lastName,
    email,
    websiteUrl,
    mobile,
    whatsapp,
    whatsappDigits
  };
}

export function createNfcVCard(details: NfcContactDetails) {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeVCardValue(details.lastName)};${escapeVCardValue(details.firstName)};;;`,
    `FN:${escapeVCardValue(details.fullName)}`,
    `EMAIL;TYPE=INTERNET:${escapeVCardValue(details.email)}`,
    `URL:${escapeVCardValue(details.websiteUrl)}`
  ];

  if (details.mobile) {
    lines.push(`TEL;TYPE=CELL,VOICE:${escapeVCardValue(details.mobile)}`);
  }

  if (details.whatsappDigits) {
    lines.push(`item1.URL:https://wa.me/${details.whatsappDigits}`);
    lines.push('item1.X-ABLabel:WhatsApp');
  }

  lines.push('END:VCARD');
  return `${lines.join('\r\n')}\r\n`;
}
