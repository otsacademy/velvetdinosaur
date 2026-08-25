'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, MessageSquareText, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { BusinessReviewFormDialog } from '@/components/admin/business-reviews/business-review-form-dialog.client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import type {
  ExternalReviewBusinessData,
  ExternalReviewBusinessInput
} from '@/lib/business-reviews/shared';

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
  return payload;
}

export function BusinessReviewsWorkspace() {
  const [businesses, setBusinesses] = useState<ExternalReviewBusinessData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ExternalReviewBusinessData | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<ExternalReviewBusinessData | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/business-reviews', { cache: 'no-store' });
      const payload = await readJson<{ businesses: ExternalReviewBusinessData[] }>(response);
      setBusinesses(payload.businesses);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load businesses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(business: ExternalReviewBusinessData) {
    setEditing(business);
    setDialogOpen(true);
  }

  async function save(values: ExternalReviewBusinessInput) {
    setSaving(true);
    try {
      const response = await fetch(
        editing ? `/api/admin/business-reviews/${encodeURIComponent(editing.id)}` : '/api/admin/business-reviews',
        {
          method: editing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        }
      );
      await readJson<{ business: ExternalReviewBusinessData }>(response);
      toast.success(editing ? 'Business updated.' : 'Business added.');
      setDialogOpen(false);
      setEditing(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save the business.');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      const response = await fetch(`/api/admin/business-reviews/${encodeURIComponent(deleting.id)}`, {
        method: 'DELETE'
      });
      await readJson<{ ok: boolean }>(response);
      toast.success('Business removed.');
      setDeleting(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not remove the business.');
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--vd-fg)]">Business Reviews</h1>
          <p className="mt-1 text-sm leading-6 text-[var(--vd-muted-fg)]">
            Find Google businesses, connect official Tripadvisor listings, and choose what appears on the public page.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/business-reviews" target="_blank" rel="noreferrer">
              View public page <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add business
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6" aria-label="Loading businesses">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : businesses.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--vd-primary)]/10 text-[var(--vd-primary)]">
                <MessageSquareText className="h-6 w-6" aria-hidden="true" />
              </span>
              <h2 className="text-lg font-semibold">No review businesses yet</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-[var(--vd-muted-fg)]">
                Add the first business, select its Google Place ID, and publish it when ready.
              </p>
              <Button className="mt-5" onClick={openCreate}><Plus className="h-4 w-4" /> Add business</Button>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead>Sources</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead className="w-16"><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {businesses.map((business) => (
                      <TableRow key={business.id}>
                        <TableCell>
                          <p className="font-medium text-[var(--vd-fg)]">{business.name}</p>
                          <p className="text-xs text-[var(--vd-muted-fg)]">{business.location || `/${business.slug}`}</p>
                        </TableCell>
                        <TableCell><SourceBadges business={business} /></TableCell>
                        <TableCell>
                          <Badge variant={business.published ? 'default' : 'secondary'}>
                            {business.published ? 'Published' : 'Draft'}
                          </Badge>
                        </TableCell>
                        <TableCell className="tabular-nums">{business.sortOrder}</TableCell>
                        <TableCell><BusinessActions business={business} onEdit={openEdit} onDelete={setDeleting} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="divide-y divide-[var(--vd-border)] md:hidden">
                {businesses.map((business) => (
                  <div key={business.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{business.name}</p>
                        <p className="text-sm text-[var(--vd-muted-fg)]">{business.location}</p>
                      </div>
                      <BusinessActions business={business} onEdit={openEdit} onDelete={setDeleting} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={business.published ? 'default' : 'secondary'}>
                        {business.published ? 'Published' : 'Draft'}
                      </Badge>
                      <SourceBadges business={business} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <p className="max-w-3xl text-xs leading-5 text-[var(--vd-muted-fg)]">
        Google review text is loaded only after a visitor requests it and is never stored. The default daily limit is 30 Google review requests. Tripadvisor widgets remain off unless the site is eligible under Tripadvisor’s widget terms; official listing links still work.
      </p>

      <BusinessReviewFormDialog
        open={dialogOpen}
        business={editing}
        saving={saving}
        onOpenChange={setDialogOpen}
        onSave={save}
      />

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && !deleteBusy && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the business from the public page and deletes its saved provider IDs. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteBusy}
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
            >
              {deleteBusy ? 'Removing…' : 'Remove business'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SourceBadges({ business }: { business: ExternalReviewBusinessData }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {business.googlePlaceId ? <Badge variant="outline">Google</Badge> : null}
      {business.tripadvisorLocationId || business.tripadvisorUrl ? <Badge variant="outline">Tripadvisor</Badge> : null}
      {!business.googlePlaceId && !business.tripadvisorLocationId && !business.tripadvisorUrl ? <span className="text-sm text-[var(--vd-muted-fg)]">None</span> : null}
    </span>
  );
}

function BusinessActions({
  business,
  onEdit,
  onDelete
}: {
  business: ExternalReviewBusinessData;
  onEdit: (business: ExternalReviewBusinessData) => void;
  onDelete: (business: ExternalReviewBusinessData) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" aria-label={`Actions for ${business.name}`}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(business)}><Pencil className="h-4 w-4" /> Edit</DropdownMenuItem>
        {business.published ? (
          <DropdownMenuItem asChild>
            <Link href={`/business-reviews#${business.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" /> View public entry
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(business)}>
          <Trash2 className="h-4 w-4" /> Remove
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
