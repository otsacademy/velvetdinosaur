'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { slugify } from '@/components/edit/dialog-utils';
import { editHref, normalizePath, pageHref } from '@/lib/page-paths';

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type DuplicateSource = {
  slug: string;
  path?: string | null;
  title?: string | null;
};

type DeleteTarget = {
  slug: string;
  path?: string | null;
  title?: string | null;
};

export function NewPageDialog({ open, onOpenChange }: DialogProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [locationTouched, setLocationTouched] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');

  const resetState = () => {
    setTitle('');
    setLocation('');
    setLocationTouched(false);
    setCreating(false);
    setMessage('');
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetState();
    }
    onOpenChange(nextOpen);
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedPath = normalizePath(location || title);
    if (!normalizedPath) {
      setMessage('Location is required.');
      return;
    }
    setCreating(true);
    setMessage('');
    try {
      const res = await fetch('/api/pages/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ path: normalizedPath, title: title.trim() })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(data?.error || 'Create failed');
        setCreating(false);
        return;
      }
      onOpenChange(false);
      router.push(editHref(data.slug));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Create failed');
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleCreate} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Create new page</DialogTitle>
            <DialogDescription>Add a title and location to create a new draft page.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="page-title">Page title</Label>
            <Input
              id="page-title"
              value={title}
              onChange={(event) => {
                const nextTitle = event.target.value;
                setTitle(nextTitle);
                if (!locationTouched) {
                  setLocation(slugify(nextTitle));
                }
              }}
              placeholder="Story, About, etc."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="page-location">Location</Label>
            <Input
              id="page-location"
              value={location}
              onChange={(event) => {
                setLocationTouched(true);
                setLocation(event.target.value);
              }}
              placeholder="about or our-work/awards"
            />
            <p className="text-xs text-[var(--vd-muted-fg)]">
              Used in the URL: /{normalizePath(location || title) || 'your-page'}
            </p>
          </div>
          {message ? <p className="text-xs text-[var(--vd-muted-fg)]">{message}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={creating}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? 'Creating...' : 'Create page'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DuplicatePageDialog({
  open,
  onOpenChange,
  source
}: DialogProps & { source: DuplicateSource | null }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [duplicating, setDuplicating] = useState(false);
  const [message, setMessage] = useState('');

  const resetState = () => {
    setTitle('');
    setLocation('');
    setDuplicating(false);
    setMessage('');
  };

  const seedState = (nextSource: DuplicateSource | null) => {
    if (!nextSource) return;
    const baseTitle = nextSource.title || nextSource.slug;
    setTitle(baseTitle);
    setLocation(`${nextSource.path || nextSource.slug}-copy`);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      resetState();
      seedState(source);
    } else {
      resetState();
    }
    onOpenChange(nextOpen);
  };

  const handleDuplicate = async (event: FormEvent) => {
    event.preventDefault();
    if (!source) return;
    const normalizedPath = normalizePath(location || title);
    if (!normalizedPath) {
      setMessage('Location is required.');
      return;
    }
    setDuplicating(true);
    setMessage('');
    try {
      const res = await fetch('/api/pages/duplicate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sourceSlug: source.slug,
          path: normalizedPath,
          title: title.trim()
        })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(data?.error || 'Duplicate failed');
        setDuplicating(false);
        return;
      }
      onOpenChange(false);
      router.push(editHref(data.slug));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Duplicate failed');
      setDuplicating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleDuplicate} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Duplicate page</DialogTitle>
            <DialogDescription>
              Create a copy of {source ? pageHref(source) : 'this page'} at a new location.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="duplicate-title">Page title</Label>
            <Input
              id="duplicate-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Duplicate title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duplicate-location">Location</Label>
            <Input
              id="duplicate-location"
              value={location}
              onChange={(event) => {
                setLocation(event.target.value);
              }}
              placeholder="your-page-copy"
            />
            <p className="text-xs text-[var(--vd-muted-fg)]">
              Used in the URL: /{normalizePath(location || title) || 'your-page'}
            </p>
          </div>
          {message ? <p className="text-xs text-[var(--vd-muted-fg)]">{message}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={duplicating}>
              Cancel
            </Button>
            <Button type="submit" disabled={duplicating}>
              {duplicating ? 'Duplicating...' : 'Duplicate page'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeletePageDialog({
  open,
  onOpenChange,
  target,
  onDeleted
}: DialogProps & { target: DeleteTarget | null; onDeleted?: (slug: string) => void }) {
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setDeleting(false);
      setMessage('');
    }
    onOpenChange(nextOpen);
  };

  const handleDelete = async () => {
    if (!target) return;
    setDeleting(true);
    setMessage('');
    try {
      const res = await fetch('/api/pages/delete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug: target.slug })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(data?.error || 'Delete failed');
        setDeleting(false);
        return;
      }
      onOpenChange(false);
      onDeleted?.(target.slug);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Delete failed');
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete page</DialogTitle>
          <DialogDescription>
            This will permanently delete {target ? pageHref(target) : 'this page'} and all its content. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {message ? <p className="text-xs text-[var(--vd-muted-fg)]">{message}</p> : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-rose-200 text-rose-600 hover:bg-rose-50"
            onClick={handleDelete}
            disabled={deleting || !target}
          >
            {deleting ? 'Deleting...' : 'Delete page'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
