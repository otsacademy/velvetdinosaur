export const NEWSLETTER_GDPR_LEGAL_TEXT_VERSION = 'gdpr-modal-v1';

export type NewsletterGdprSection = {
  heading: string;
  body?: string;
  bullets?: string[];
};

export const NEWSLETTER_GDPR_MODAL_TITLE = 'GDPR Consent: Data Protection Agreement';

export const NEWSLETTER_GDPR_MODAL_INTRO =
  'Thank you for visiting the ASAP website. We are committed to protecting your privacy and ensuring that your personal data is handled in accordance with the General Data Protection Regulation (GDPR). Below, you will find information about how we collect, use, and protect your data.';

export const NEWSLETTER_GDPR_SECTIONS: NewsletterGdprSection[] = [
  {
    heading: 'Why We Collect Your Data',
    body: 'We collect your personal data to:',
    bullets: [
      'Keep you updated about our activities, events, and campaigns',
      'Improve our services by understanding how you interact with our website',
      'Facilitate communication with you regarding your involvement with ASAP'
    ]
  },
  {
    heading: 'What Personal Data We Collect',
    body: 'We collect the following types of personal data:',
    bullets: ['Name and Surname', 'Email Address']
  },
  {
    heading: 'How Your Data Will Be Used',
    body: 'Your data will be used for the purposes mentioned above. We will not use your data for any other purpose without your explicit consent.'
  },
  {
    heading: 'Data Storage and Processing',
    body: 'Your data will be stored securely for as long as necessary to fulfill the purposes outlined above. We will review and update our data retention policies regularly to ensure compliance with GDPR.'
  },
  {
    heading: 'Sharing Data with Third Parties',
    body: 'We may share your data with third-party service providers who assist us in managing our communications and services. These providers are bound by confidentiality agreements and are required to comply with GDPR.'
  },
  {
    heading: 'Your Rights',
    body: 'You have the right to:',
    bullets: [
      'Access your personal data',
      'Rectify any inaccuracies in your personal data',
      'Erase your personal data',
      'Withdraw consent at any time without negative consequences'
    ]
  },
  {
    heading: 'Contact Information for Data Protection',
    body: 'For any questions or concerns regarding data protection, please contact us at global@academicsstand.org'
  }
];
