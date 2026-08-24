import { describe, expect, it } from 'bun:test';
import {
  CONTACT_METHODS,
  PROJECT_FEATURES,
  composeProjectMessage,
  composeQuestionMessage,
  contactMethodLabel,
  featureLabel,
  methodNeedsPhone
} from './enquiry-options';

describe('composeProjectMessage', () => {
  it('lists the business, website status, contact preference and ticked features', () => {
    const body = composeProjectMessage(
      {
        business: 'Minster Lovell Dental',
        businessType: 'dental practice',
        websiteStatus: 'replace',
        websiteUrl: 'www.example.co.uk',
        contactMethod: 'phone',
        phone: '07000 000000',
        features: ['bookings', 'reviews']
      },
      'We need online booking before the summer.'
    );

    expect(body).toContain('Free preview request');
    expect(body).toContain('Business: Minster Lovell Dental');
    expect(body).toContain('Type of business: dental practice');
    expect(body).toContain('Website: I have one and want it replaced — www.example.co.uk');
    expect(body).toContain('Preferred contact: A phone call — 07000 000000');
    expect(body).toContain('• Online booking (syncs with Google Calendar)');
    expect(body).toContain('• Google reviews shown on your site');
    expect(body).toContain('We need online booking before the summer.');
  });

  it('omits optional rows that were left blank', () => {
    const body = composeProjectMessage({ business: 'Acme' }, 'no notes');
    expect(body).toContain('Business: Acme');
    expect(body).not.toContain('Type of business:');
    expect(body).not.toContain('Preferred contact:');
    expect(body).not.toContain('Features they want:');
  });

  it('records the preferred method on its own when no number is given', () => {
    const body = composeProjectMessage({ business: 'Acme', contactMethod: 'in-person' }, 'notes');
    expect(body).toContain('Preferred contact: In person (Oxfordshire area)');
  });

  it('keeps every feature id resolvable to a human label', () => {
    for (const feature of PROJECT_FEATURES) {
      expect(featureLabel(feature.id)).toBe(feature.label);
    }
  });
});

describe('composeQuestionMessage', () => {
  it('puts the preferred contact above the question', () => {
    const body = composeQuestionMessage('whatsapp', '07000 000000', 'How do backups work?');
    expect(body).toBe('Preferred contact: WhatsApp — 07000 000000\n\nHow do backups work?');
  });

  it('falls back to the bare question when nothing was chosen', () => {
    expect(composeQuestionMessage(null, null, 'Just asking')).toBe('Just asking');
  });
});

describe('contact methods', () => {
  it('only asks for a phone number when one is needed', () => {
    expect(methodNeedsPhone('phone')).toBe(true);
    expect(methodNeedsPhone('whatsapp')).toBe(true);
    expect(methodNeedsPhone('email')).toBe(false);
    expect(methodNeedsPhone('in-person')).toBe(false);
  });

  it('keeps every method id resolvable to a human label', () => {
    for (const method of CONTACT_METHODS) {
      expect(contactMethodLabel(method.id)).toBe(method.label);
    }
  });
});
