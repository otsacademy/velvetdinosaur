'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
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
import { isReservedPath, normalizePath, pageHref } from '@/lib/page-paths';

type MoveTarget = {
  slug: string;
  path?: string | null;
  title?: string | null;
};

type MovePageDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: MoveTarget | null;
  onMoved?: (slug: string, path: string) => void;
};

export function MovePageDialog({ open, onOpenChange, target, onMoved }: MovePageDialogProps) {
  const [location, setLocation] = useState('');
  const [moving, setMoving] = useState(false);
  const [message, setMessage] = useState('');

  const currentHref = target ? pageHref(target) : '';
  const normalizedPath = normalizePath(location);
  const reserved = normalizedPath ? isReservedPath(normalizedPath) : false;
  const unchanged = normalizedPath ? `/${normalizedPath}` === currentHref : false;

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setLocation(target ? pageHref(target).slice(1) : '');
      setMessage('');
      setMoving(false);
    } else {
      setLocation('');
      setMessage('');
      setMoving(false);
    }
    onOpenChange(nextOpen);
  };

  const handleMove = async (event: FormEvent) => {
    event.preventDefault();
    if (!target || !normalizedPath || reserved || unchanged) return;
    setMoving(true);
    setMessage('');
    try {
      const res = await fetch('/api/pages/move', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug: target.slug, path: normalizedPath })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(data?.error || 'Move failed');
        setMoving(false);
        return;
      }
      onOpenChange(false);
      onMoved?.(target.slug, data?.path || normalizedPath);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Move failed');
      setMoving(false);
    }
  };

  const hint = !location
    ? null
    : !normalizedPath
      ? 'Enter a valid location like about or our-work/awards.'
      : reserved
        ? 'That location is reserved.'
        : unchanged
          ? 'This is already the current URL.'
          : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleMove} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Move page</DialogTitle>
            <DialogDescription>
              Change where {target?.title || currentHref || 'this page'} lives on the site. The old
              address will permanently redirect to the new one, and links on other pages will be
              updated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="move-location">New location</Label>
            <Input
              id="move-location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="our-work/awards"
            />
            <p className="text-xs text-[var(--vd-muted-fg)]">
              {currentHref ? `Current URL: ${currentHref} — ` : ''}New URL: /
              {normalizedPath || 'your-page'}
            </p>
            {hint ? <p className="text-xs text-[var(--vd-muted-fg)]">{hint}</p> : null}
          </div>
          {message ? <p className="text-xs text-[var(--vd-muted-fg)]">{message}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={moving}>
              Cancel
            </Button>
            <Button type="submit" disabled={moving || !target || !normalizedPath || reserved || unchanged}>
              {moving ? 'Moving...' : 'Move page'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
