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

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type DuplicateSource = {
  slug: string;
  title?: string | null;
};

type DeleteTarget = {
  slug: string;
  title?: string | null;
};

export function NewPageDialog({ open, onOpenChange }: DialogProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');

  const resetState = () => {
    setTitle('');
    setSlug('');
    setSlugTouched(false);
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
    const normalizedSlug = slugify(slug);
    if (!normalizedSlug) {
      setMessage('Slug is required.');
      return;
    }
    setCreating(true);
    setMessage('');
    try {
      const res = await fetch('/api/pages/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug: normalizedSlug, title: title.trim() })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(data?.error || 'Create failed');
        setCreating(false);
        return;
      }
      onOpenChange(false);
      router.push(`/edit/${encodeURIComponent(data.slug || normalizedSlug)}`);
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
            <DialogDescription>Add a title and slug to create a new draft page.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="page-title">Page title</Label>
            <Input
              id="page-title"
              value={title}
              onChange={(event) => {
                const nextTitle = event.target.value;
                setTitle(nextTitle);
                if (!slugTouched) {
                  setSlug(slugify(nextTitle));
                }
              }}
              placeholder="Story, About, etc."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="page-slug">Slug</Label>
            <Input
              id="page-slug"
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(event.target.value);
              }}
              placeholder="about"
            />
            <p className="text-xs text-[var(--vd-muted-fg)]">
              Used in the URL: /{slugify(slug || title) || 'your-slug'}
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
  const [slug, setSlug] = useState('');
  const [duplicating, setDuplicating] = useState(false);
  const [message, setMessage] = useState('');

  const resetState = () => {
    setTitle('');
    setSlug('');
    setDuplicating(false);
    setMessage('');
  };

  const seedState = (nextSource: DuplicateSource | null) => {
    if (!nextSource) return;
    const baseTitle = nextSource.title || nextSource.slug;
    setTitle(baseTitle);
    setSlug(`${nextSource.slug}-copy`);
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
    const normalizedSlug = slugify(slug);
    if (!normalizedSlug) {
      setMessage('Slug is required.');
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
          slug: normalizedSlug,
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
      router.push(`/edit/${encodeURIComponent(data.slug || normalizedSlug)}`);
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
              Create a copy of {source?.slug || 'this page'} with a new slug and title.
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
            <Label htmlFor="duplicate-slug">Slug</Label>
            <Input
              id="duplicate-slug"
              value={slug}
              onChange={(event) => {
                setSlug(event.target.value);
              }}
              placeholder="your-page-copy"
            />
            <p className="text-xs text-[var(--vd-muted-fg)]">
              Used in the URL: /{slugify(slug || title) || 'your-slug'}
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
            This will permanently delete {target?.slug ? `/${target.slug}` : 'this page'} and all its content. This cannot be undone.
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
