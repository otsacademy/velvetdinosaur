import { describe, expect, it } from 'bun:test';
import { PROJECT_FEATURES, composeProjectMessage, featureLabel } from './enquiry-options';

describe('composeProjectMessage', () => {
  it('lists the business, website status and ticked features by label', () => {
    const body = composeProjectMessage(
      {
        business: 'Minster Lovell Dental',
        businessType: 'dental practice',
        websiteStatus: 'replace',
        websiteUrl: 'www.example.co.uk',
        phone: '07000 000000',
        features: ['bookings', 'reviews']
      },
      'We need online booking before the summer.'
    );

    expect(body).toContain('Free preview request');
    expect(body).toContain('Business: Minster Lovell Dental');
    expect(body).toContain('Type of business: dental practice');
    expect(body).toContain('Website: I have one and want it replaced — www.example.co.uk');
    expect(body).toContain('Phone: 07000 000000');
    expect(body).toContain('• Online booking (syncs with Google Calendar)');
    expect(body).toContain('• Google reviews shown on your site');
    expect(body).toContain('We need online booking before the summer.');
  });

  it('omits optional rows that were left blank', () => {
    const body = composeProjectMessage({ business: 'Acme' }, 'no notes');
    expect(body).toContain('Business: Acme');
    expect(body).not.toContain('Type of business:');
    expect(body).not.toContain('Phone:');
    expect(body).not.toContain('Features they want:');
  });

  it('keeps every feature id resolvable to a human label', () => {
    for (const feature of PROJECT_FEATURES) {
      expect(featureLabel(feature.id)).toBe(feature.label);
    }
  });
});
