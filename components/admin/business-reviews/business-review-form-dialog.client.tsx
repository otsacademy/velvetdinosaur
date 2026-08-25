'use client';

import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLink, Loader2, MapPin, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  ExternalReviewBusinessInputSchema,
  type ExternalReviewBusinessData,
  type ExternalReviewBusinessInput,
  type GooglePlaceSearchResult
} from '@/lib/business-reviews/shared';

const EMPTY_VALUES: ExternalReviewBusinessInput = {
  name: '',
  slug: '',
  location: '',
  category: '',
  summary: '',
  websiteUrl: '',
  published: false,
  sortOrder: 0,
  googlePlaceId: '',
  tripadvisorLocationId: '',
  tripadvisorUrl: ''
};

function toFormValues(business: ExternalReviewBusinessData | null): ExternalReviewBusinessInput {
  if (!business) return EMPTY_VALUES;
  return {
    name: business.name,
    slug: business.slug,
    location: business.location,
    category: business.category,
    summary: business.summary,
    websiteUrl: business.websiteUrl,
    published: business.published,
    sortOrder: business.sortOrder,
    googlePlaceId: business.googlePlaceId,
    tripadvisorLocationId: business.tripadvisorLocationId,
    tripadvisorUrl: business.tripadvisorUrl
  };
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

type BusinessReviewFormDialogProps = {
  open: boolean;
  business: ExternalReviewBusinessData | null;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: ExternalReviewBusinessInput) => Promise<void>;
};

export function BusinessReviewFormDialog({
  open,
  business,
  saving,
  onOpenChange,
  onSave
}: BusinessReviewFormDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [places, setPlaces] = useState<GooglePlaceSearchResult[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<GooglePlaceSearchResult | null>(null);
  const form = useForm<ExternalReviewBusinessInput>({
    resolver: zodResolver(ExternalReviewBusinessInputSchema),
    defaultValues: EMPTY_VALUES
  });

  useEffect(() => {
    if (!open) return;
    form.reset(toFormValues(business));
    setSearchQuery(business?.name || '');
    setPlaces([]);
    setSearchError('');
    setSelectedPlace(null);
  }, [business, form, open]);

  const title = business ? 'Edit business' : 'Add business';
  const googlePlaceId = form.watch('googlePlaceId');
  const canSearch = searchQuery.trim().length >= 3 && !searching;
  const selectedLabel = useMemo(() => {
    if (selectedPlace) return `${selectedPlace.name}${selectedPlace.address ? ` — ${selectedPlace.address}` : ''}`;
    return googlePlaceId ? `Place ID: ${googlePlaceId}` : '';
  }, [googlePlaceId, selectedPlace]);

  async function searchGoogle() {
    if (!canSearch) return;
    setSearching(true);
    setSearchError('');
    setPlaces([]);
    try {
      const response = await fetch('/api/admin/business-reviews/google-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      const payload = (await response.json().catch(() => ({}))) as {
        places?: GooglePlaceSearchResult[];
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || 'Could not search Google');
      setPlaces(payload.places || []);
      if (!payload.places?.length) setSearchError('No matching Google businesses were found.');
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Could not search Google');
    } finally {
      setSearching(false);
    }
  }

  function selectPlace(place: GooglePlaceSearchResult) {
    form.setValue('googlePlaceId', place.placeId, { shouldDirty: true, shouldValidate: true });
    setSelectedPlace(place);
    setPlaces([]);
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !saving && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Add your own public business details, then connect its Google Place ID and official Tripadvisor listing.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSave)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Public business name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        autoComplete="organization"
                        onBlur={(event) => {
                          field.onBlur();
                          if (!business && !form.getValues('slug')) {
                            form.setValue('slug', slugify(event.target.value), { shouldValidate: true });
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Public URL name</FormLabel>
                    <FormControl><Input {...field} autoCapitalize="none" spellCheck={false} /></FormControl>
                    <FormDescription>Used for the review request URL, for example “the-dino-cafe”.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl><Input {...field} autoComplete="address-level2" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl><Input {...field} placeholder="Restaurant, hotel, attraction…" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short description</FormLabel>
                  <FormControl><Textarea {...field} rows={3} className="resize-y" /></FormControl>
                  <FormDescription>Written by you and shown above the review sources.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business website</FormLabel>
                    <FormControl><Input {...field} type="url" placeholder="https://example.com" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display order</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        inputMode="numeric"
                        onChange={(event) => field.onChange(Number(event.target.value || 0))}
                      />
                    </FormControl>
                    <FormDescription>Lower numbers appear first.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <fieldset className="space-y-4 rounded-lg border border-[var(--vd-border)] p-4">
              <legend className="px-1 text-sm font-semibold">Google Reviews</legend>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void searchGoogle();
                    }
                  }}
                  aria-label="Search Google for a business"
                  placeholder="Business name and town"
                />
                <Button type="button" variant="outline" disabled={!canSearch} onClick={() => void searchGoogle()}>
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Search Google
                </Button>
              </div>
              {searchError ? <p role="alert" className="text-sm text-destructive">{searchError}</p> : null}
              {places.length ? (
                <div className="space-y-2" aria-label="Google business search results">
                  {places.map((place) => (
                    <div key={place.placeId} className="flex flex-col gap-3 rounded-md border border-[var(--vd-border)] p-3 sm:flex-row sm:items-center">
                      <MapPin className="h-4 w-4 shrink-0 text-[var(--vd-primary)]" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-[var(--vd-fg)]">{place.name}</p>
                        <p className="text-sm text-[var(--vd-muted-fg)]">{place.address}</p>
                      </div>
                      <Button type="button" size="sm" variant="secondary" onClick={() => selectPlace(place)}>
                        Use this business
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
              <FormField
                control={form.control}
                name="googlePlaceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Google Place ID</FormLabel>
                    <FormControl><Input {...field} autoCapitalize="none" spellCheck={false} /></FormControl>
                    <FormDescription>
                      Only this ID is saved. Google review text is requested live and is never stored.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {selectedLabel ? <p className="text-sm font-medium text-[var(--vd-primary)]">Selected: {selectedLabel}</p> : null}
            </fieldset>

            <fieldset className="grid gap-4 rounded-lg border border-[var(--vd-border)] p-4 sm:grid-cols-2">
              <legend className="px-1 text-sm font-semibold">Tripadvisor listing</legend>
              <FormField
                control={form.control}
                name="tripadvisorLocationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tripadvisor location ID</FormLabel>
                    <FormControl><Input {...field} inputMode="numeric" placeholder="5568578" /></FormControl>
                    <FormDescription>Optional. Needed only for an approved Tripadvisor widget; it is often the number after “-d” in the listing URL.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tripadvisorUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tripadvisor listing URL</FormLabel>
                    <FormControl><Input {...field} type="url" placeholder="https://www.tripadvisor.co.uk/…" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </fieldset>

            <FormField
              control={form.control}
              name="published"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-4 rounded-lg border border-[var(--vd-border)] p-4">
                  <div className="space-y-1">
                    <FormLabel>Published</FormLabel>
                    <FormDescription>Show this business on the public reviews page.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {business ? 'Save changes' : 'Add business'}
              </Button>
            </DialogFooter>
          </form>
        </Form>

        {selectedPlace?.googleMapsUri ? (
          <a
            href={selectedPlace.googleMapsUri}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-[var(--vd-primary)] underline-offset-4 hover:underline"
          >
            Check the selected listing on Google Maps <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
