// Options shared by the contact enquiry form and /api/contact, so the labels
// that reach Ian's inbox are exactly the ones the visitor ticked.

export type EnquiryType = 'project' | 'question';

export type FeatureOption = { id: string; label: string };

/** What a Velvet Dinosaur site can include today (agreement §1 + platform). */
export const PROJECT_FEATURES: FeatureOption[] = [
  { id: 'contact-forms', label: 'Contact & enquiry forms' },
  { id: 'bookings', label: 'Online booking (syncs with Google Calendar)' },
  { id: 'news', label: 'News or blog posts' },
  { id: 'newsletter', label: 'Email newsletter' },
  { id: 'events', label: 'Events & registrations' },
  { id: 'payments', label: 'Online payments or a shop' },
  { id: 'reviews', label: 'Google reviews shown on your site' },
  { id: 'social', label: 'Instagram & Facebook posts on your site' },
  { id: 'galleries', label: 'Photo galleries & media library' },
  { id: 'portfolio', label: 'Portfolio or case studies' },
  { id: 'team', label: 'Logins for more than one person' },
  { id: 'unsure', label: 'Not sure yet — please advise' },
];

/** How they'd like Ian to get back to them. */
export const CONTACT_METHODS: FeatureOption[] = [
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'A phone call' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'video', label: 'Video call' },
  { id: 'in-person', label: 'In person (Oxfordshire area)' },
];

export const WEBSITE_STATUSES: FeatureOption[] = [
  { id: 'new', label: 'I don’t have a website yet' },
  { id: 'replace', label: 'I have one and want it replaced' },
  { id: 'improve', label: 'I have one and want it improved' },
];

const FEATURE_LABELS = new Map(PROJECT_FEATURES.map((f) => [f.id, f.label]));
const METHOD_LABELS = new Map(CONTACT_METHODS.map((m) => [m.id, m.label]));
const STATUS_LABELS = new Map(WEBSITE_STATUSES.map((s) => [s.id, s.label]));

export function featureLabel(id: string) {
  return FEATURE_LABELS.get(id) || id;
}

export function websiteStatusLabel(id: string) {
  return STATUS_LABELS.get(id) || id;
}

export function contactMethodLabel(id: string) {
  return METHOD_LABELS.get(id) || id;
}

/** These methods are useless without a number to ring. */
export function methodNeedsPhone(id: string) {
  return id === 'phone' || id === 'whatsapp';
}

/** "Preferred contact: A phone call — 07000 000000" */
export function contactPreferenceLine(method?: string | null, phone?: string | null) {
  if (!method && !phone) return null;
  const label = method ? contactMethodLabel(method) : null;
  if (label && phone) return `Preferred contact: ${label} — ${phone}`;
  if (label) return `Preferred contact: ${label}`;
  return `Preferred contact: ${phone}`;
}

/** True when the chosen status means they already have a site to point at. */
export function statusHasExistingSite(id: string) {
  return id === 'replace' || id === 'improve';
}

export type ProjectEnquiry = {
  business: string;
  contactMethod?: string | null;
  businessType?: string | null;
  websiteStatus?: string | null;
  websiteUrl?: string | null;
  phone?: string | null;
  features?: string[] | null;
};

/** Flatten the project answers into the plain-text body Ian reads. */
export function composeProjectMessage(project: ProjectEnquiry, notes: string) {
  const lines: string[] = ['Free preview request', ''];
  lines.push(`Business: ${project.business}`);
  if (project.businessType) lines.push(`Type of business: ${project.businessType}`);

  const status = project.websiteStatus ? websiteStatusLabel(project.websiteStatus) : null;
  if (status) {
    lines.push(
      project.websiteUrl ? `Website: ${status} — ${project.websiteUrl}` : `Website: ${status}`
    );
  } else if (project.websiteUrl) {
    lines.push(`Website: ${project.websiteUrl}`);
  }

  const preference = contactPreferenceLine(project.contactMethod, project.phone);
  if (preference) lines.push(preference);

  if (project.features?.length) {
    lines.push('', 'Features they want:');
    for (const id of project.features) lines.push(`• ${featureLabel(id)}`);
  }

  lines.push('', 'Anything else:', notes);
  return lines.join('\n');
}

/** A plain question still records how they'd like to be answered. */
export function composeQuestionMessage(
  contactMethod: string | null | undefined,
  phone: string | null | undefined,
  notes: string
) {
  const preference = contactPreferenceLine(contactMethod, phone);
  return preference ? `${preference}\n\n${notes}` : notes;
}
