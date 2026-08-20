'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type BulkMetadataPayload = {
  applyCaption: boolean;
  caption: string;
  applyAlt: boolean;
  alt: string;
  applyTags: boolean;
  tags: string;
  tagMode: 'replace' | 'add' | 'remove';
};

export function MediaLibraryBulkEditDialog({
  open,
  onOpenChange,
  selectedCount,
  saving,
  onApply
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  saving: boolean;
  onApply: (payload: BulkMetadataPayload) => void;
}) {
  const [applyCaption, setApplyCaption] = useState(false);
  const [caption, setCaption] = useState('');
  const [applyAlt, setApplyAlt] = useState(false);
  const [alt, setAlt] = useState('');
  const [applyTags, setApplyTags] = useState(false);
  const [tags, setTags] = useState('');
  const [tagMode, setTagMode] = useState<'replace' | 'add' | 'remove'>('replace');

  const canSubmit = useMemo(() => applyCaption || applyAlt || applyTags, [applyAlt, applyCaption, applyTags]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk edit metadata</DialogTitle>
          <DialogDescription>
            Apply metadata updates to {selectedCount} selected asset{selectedCount === 1 ? '' : 's'}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={applyCaption}
                onCheckedChange={(value) => setApplyCaption(value === true)}
                disabled={saving}
                aria-label="Update caption"
              />
              <p className="text-sm font-medium">Update caption</p>
            </div>
            <Input
              placeholder="Leave empty to clear caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={saving || !applyCaption}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={applyAlt}
                onCheckedChange={(value) => setApplyAlt(value === true)}
                disabled={saving}
                aria-label="Update alt text"
              />
              <p className="text-sm font-medium">Update alt text</p>
            </div>
            <Input
              placeholder="Leave empty to clear alt text"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              disabled={saving || !applyAlt}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={applyTags}
                onCheckedChange={(value) => setApplyTags(value === true)}
                disabled={saving}
                aria-label="Update tags"
              />
              <p className="text-sm font-medium">Update tags</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[160px_1fr]">
              <Select value={tagMode} onValueChange={(value) => setTagMode(value as 'replace' | 'add' | 'remove')} disabled={saving || !applyTags}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="replace">Replace tags</SelectItem>
                  <SelectItem value="add">Add tags</SelectItem>
                  <SelectItem value="remove">Remove tags</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Comma-separated tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={saving || !applyTags}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              onApply({
                applyCaption,
                caption,
                applyAlt,
                alt,
                applyTags,
                tags,
                tagMode
              })
            }
            disabled={saving || !canSubmit}
          >
            {saving ? 'Applying…' : 'Apply to selected'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
