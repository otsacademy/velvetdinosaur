import { describe, expect, it } from 'bun:test';
import {
  ExternalReviewBusinessInputSchema,
  GooglePlaceSearchInputSchema
} from './shared';

const validBusiness = {
  name: 'The Dinosaur Cafe',
  slug: 'the-dinosaur-cafe',
  location: 'Oxford',
  category: 'Restaurant',
  summary: 'A friendly local cafe.',
  websiteUrl: 'https://example.com',
  published: true,
  sortOrder: 10,
  googlePlaceId: 'ChIJ-example',
  tripadvisorLocationId: '1234567',
  tripadvisorUrl: 'https://www.tripadvisor.co.uk/Restaurant_Review-example.html'
};

describe('ExternalReviewBusinessInputSchema', () => {
  it('accepts a complete business with official provider references', () => {
    expect(ExternalReviewBusinessInputSchema.safeParse(validBusiness).success).toBe(true);
  });

  it('accepts empty optional provider and website fields', () => {
    const result = ExternalReviewBusinessInputSchema.safeParse({
      ...validBusiness,
      websiteUrl: '',
      googlePlaceId: '',
      tripadvisorLocationId: '',
      tripadvisorUrl: ''
    });
    expect(result.success).toBe(true);
  });

  it('rejects unsafe or unofficial URLs', () => {
    expect(ExternalReviewBusinessInputSchema.safeParse({
      ...validBusiness,
      websiteUrl: 'javascript:alert(1)'
    }).success).toBe(false);
    expect(ExternalReviewBusinessInputSchema.safeParse({
      ...validBusiness,
      tripadvisorUrl: 'https://example.com/fake-tripadvisor-page'
    }).success).toBe(false);
  });

  it('rejects invalid API slugs and Tripadvisor IDs', () => {
    expect(ExternalReviewBusinessInputSchema.safeParse({ ...validBusiness, slug: '../admin' }).success).toBe(false);
    expect(ExternalReviewBusinessInputSchema.safeParse({ ...validBusiness, tripadvisorLocationId: 'abc123' }).success).toBe(false);
  });
});

describe('GooglePlaceSearchInputSchema', () => {
  it('requires a useful, bounded search query', () => {
    expect(GooglePlaceSearchInputSchema.safeParse({ query: 'Dinosaur Cafe Oxford' }).success).toBe(true);
    expect(GooglePlaceSearchInputSchema.safeParse({ query: 'ab' }).success).toBe(false);
    expect(GooglePlaceSearchInputSchema.safeParse({ query: 'x'.repeat(161) }).success).toBe(false);
  });
});
