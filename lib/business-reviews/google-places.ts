import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/business-reviews/google-places.ts');

import { z } from 'zod';
import type {
  GooglePlaceReviewsData,
  GooglePlaceSearchResult,
  GoogleReviewData
} from '@/lib/business-reviews/shared';

const GOOGLE_PLACES_ROOT = 'https://places.googleapis.com/v1';

const localizedTextSchema = z.object({
  text: z.string().optional().default(''),
  languageCode: z.string().optional()
});

const authorSchema = z.object({
  displayName: z.string().optional().default('Google Maps user'),
  uri: z.string().optional().default(''),
  photoUri: z.string().optional().default('')
});

const reviewSchema = z.object({
  name: z.string().optional().default(''),
  relativePublishTimeDescription: z.string().optional().default(''),
  rating: z.number().optional().default(0),
  text: localizedTextSchema.optional(),
  originalText: localizedTextSchema.optional(),
  authorAttribution: authorSchema.optional(),
  publishTime: z.string().optional().default(''),
  visitDate: z.object({ year: z.number().int(), month: z.number().int().min(1).max(12) }).optional(),
  googleMapsUri: z.string().optional().default('')
});

const placeReviewsResponseSchema = z.object({
  id: z.string(),
  displayName: localizedTextSchema.optional(),
  rating: z.number().optional(),
  userRatingCount: z.number().int().optional(),
  googleMapsUri: z.string().optional().default(''),
  reviews: z.array(reviewSchema).optional().default([])
});

const searchResponseSchema = z.object({
  places: z
    .array(
      z.object({
        id: z.string(),
        displayName: localizedTextSchema.optional(),
        formattedAddress: z.string().optional().default(''),
        googleMapsUri: z.string().optional().default('')
      })
    )
    .optional()
    .default([])
});

function apiKey() {
  const value = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!value) throw new Error('Google Places is not configured');
  return value;
}

export function isGooglePlacesConfigured() {
  return Boolean(process.env.GOOGLE_PLACES_API_KEY?.trim());
}

async function readGoogleJson(response: Response) {
  if (response.ok) return response.json();
  const payload = (await response.json().catch(() => null)) as { error?: { status?: string } } | null;
  const status = payload?.error?.status || `HTTP_${response.status}`;
  throw new Error(`Google Places request failed: ${status}`);
}

export async function searchGooglePlaces(query: string): Promise<GooglePlaceSearchResult[]> {
  const response = await fetch(`${GOOGLE_PLACES_ROOT}/places:searchText`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey(),
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.googleMapsUri'
    },
    body: JSON.stringify({ textQuery: query, pageSize: 8 })
  });
  const parsed = searchResponseSchema.parse(await readGoogleJson(response));
  return parsed.places.map((place) => ({
    placeId: place.id,
    name: place.displayName?.text || 'Unnamed business',
    address: place.formattedAddress,
    googleMapsUri: place.googleMapsUri
  }));
}

function mapReview(review: z.infer<typeof reviewSchema>, index: number): GoogleReviewData {
  const author = review.authorAttribution;
  return {
    id: review.name || `${review.publishTime || 'review'}-${index}`,
    rating: review.rating,
    text: review.text?.text || '',
    originalText: review.originalText?.text || '',
    relativePublishTimeDescription: review.relativePublishTimeDescription,
    publishTime: review.publishTime,
    visitDate: review.visitDate || null,
    googleMapsUri: review.googleMapsUri,
    author: {
      displayName: author?.displayName || 'Google Maps user',
      uri: author?.uri || '',
      photoUri: author?.photoUri || ''
    }
  };
}

export async function getGooglePlaceReviews(placeId: string): Promise<GooglePlaceReviewsData> {
  const encodedPlaceId = encodeURIComponent(placeId);
  const response = await fetch(`${GOOGLE_PLACES_ROOT}/places/${encodedPlaceId}`, {
    cache: 'no-store',
    headers: {
      'X-Goog-Api-Key': apiKey(),
      'X-Goog-FieldMask': 'id,displayName,rating,userRatingCount,googleMapsUri,reviews'
    }
  });
  const place = placeReviewsResponseSchema.parse(await readGoogleJson(response));
  return {
    placeId: place.id,
    name: place.displayName?.text || '',
    rating: place.rating ?? null,
    userRatingCount: place.userRatingCount ?? null,
    googleMapsUri: place.googleMapsUri,
    reviews: place.reviews.slice(0, 5).map(mapReview)
  };
}
