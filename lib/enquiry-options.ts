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

export const WEBSITE_STATUSES: FeatureOption[] = [
  { id: 'new', label: 'I don’t have a website yet' },
  { id: 'replace', label: 'I have one and want it replaced' },
  { id: 'improve', label: 'I have one and want it improved' },
];

const FEATURE_LABELS = new Map(PROJECT_FEATURES.map((f) => [f.id, f.label]));
const STATUS_LABELS = new Map(WEBSITE_STATUSES.map((s) => [s.id, s.label]));

export function featureLabel(id: string) {
  return FEATURE_LABELS.get(id) || id;
}

export function websiteStatusLabel(id: string) {
  return STATUS_LABELS.get(id) || id;
}

/** True when the chosen status means they already have a site to point at. */
export function statusHasExistingSite(id: string) {
  return id === 'replace' || id === 'improve';
}

export type ProjectEnquiry = {
  business: string;
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

  if (project.phone) lines.push(`Phone: ${project.phone}`);

  if (project.features?.length) {
    lines.push('', 'Features they want:');
    for (const id of project.features) lines.push(`• ${featureLabel(id)}`);
  }

  lines.push('', 'Anything else:', notes);
  return lines.join('\n');
}
