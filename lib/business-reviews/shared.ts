import { z } from 'zod';

export const BUSINESS_REVIEW_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const optionalHttpUrl = z
  .string()
  .trim()
  .max(500)
  .refine((value) => !value || /^https?:\/\//i.test(value), 'Enter a full http or https URL');

const optionalTripadvisorUrl = optionalHttpUrl.refine((value) => {
  if (!value) return true;
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === 'tripadvisor.com' || host.endsWith('.tripadvisor.com') || host === 'tripadvisor.co.uk' || host.endsWith('.tripadvisor.co.uk');
  } catch {
    return false;
  }
}, 'Use an official Tripadvisor URL');

export const ExternalReviewBusinessInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().min(2).max(100).regex(BUSINESS_REVIEW_SLUG_PATTERN),
  location: z.string().trim().max(160),
  category: z.string().trim().max(80),
  summary: z.string().trim().max(600),
  websiteUrl: optionalHttpUrl,
  published: z.boolean(),
  sortOrder: z.number().int().min(-10000).max(10000),
  googlePlaceId: z.string().trim().max(240),
  tripadvisorLocationId: z.string().trim().regex(/^\d*$/, 'Use the numeric Tripadvisor location ID').max(30),
  tripadvisorUrl: optionalTripadvisorUrl
});

export const GooglePlaceSearchInputSchema = z.object({
  query: z.string().trim().min(3).max(160)
});

export type ExternalReviewBusinessInput = z.infer<typeof ExternalReviewBusinessInputSchema>;

export type ExternalReviewBusinessData = ExternalReviewBusinessInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type GooglePlaceSearchResult = {
  placeId: string;
  name: string;
  address: string;
  googleMapsUri: string;
};

export type GoogleReviewData = {
  id: string;
  rating: number;
  text: string;
  originalText: string;
  relativePublishTimeDescription: string;
  publishTime: string;
  visitDate: { year: number; month: number } | null;
  googleMapsUri: string;
  author: {
    displayName: string;
    uri: string;
    photoUri: string;
  };
};

export type GooglePlaceReviewsData = {
  placeId: string;
  name: string;
  rating: number | null;
  userRatingCount: number | null;
  googleMapsUri: string;
  reviews: GoogleReviewData[];
};
