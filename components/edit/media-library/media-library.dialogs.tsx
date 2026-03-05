/* eslint-disable @next/next/no-img-element -- Media library supports arbitrary external URLs */
'use client';

import { Copy, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { buildAssetImageUrl, buildAssetUrl, type AssetFolderItem } from '@/lib/uploads';
import { FOLDER_ROOT, type AssetListItem } from './media-library.types';

export function MediaLibraryDialogs({
  folders,
  showCreateFolder,
  setShowCreateFolder,
  creatingFolder,
  newFolderPath,
  setNewFolderPath,
  newFolderLabel,
  setNewFolderLabel,
  onCreateFolder,
  editKey,
  setEditKey,
  draftName,
  setDraftName,
  draftCaption,
  setDraftCaption,
  draftAlt,
  setDraftAlt,
  draftFolder,
  setDraftFolder,
  saving,
  onSaveEdit,
  previewKey,
  setPreviewKey,
  onCopy,
  onEditFromPreview,
  onDeleteFromPreview,
  confirmDeleteKeys,
  setConfirmDeleteKeys,
  onConfirmDelete
}: {
  folders: AssetFolderItem[];
  showCreateFolder: boolean;
  setShowCreateFolder: (open: boolean) => void;
  creatingFolder: boolean;
  newFolderPath: string;
  setNewFolderPath: (value: string) => void;
  newFolderLabel: string;
  setNewFolderLabel: (value: string) => void;
  onCreateFolder: () => void;
  editKey: string | null;
  setEditKey: (value: string | null) => void;
  draftName: string;
  setDraftName: (value: string) => void;
  draftCaption: string;
  setDraftCaption: (value: string) => void;
  draftAlt: string;
  setDraftAlt: (value: string) => void;
  draftFolder: string;
  setDraftFolder: (value: string) => void;
  saving: boolean;
  onSaveEdit: () => void;
  previewKey: string | null;
  setPreviewKey: (value: string | null) => void;
  onCopy: (key: string) => void;
  onEditFromPreview: (key: string) => void;
  onDeleteFromPreview: (key: string) => void;
  confirmDeleteKeys: string[] | null;
  setConfirmDeleteKeys: (keys: string[] | null) => void;
  onConfirmDelete: () => void;
}) {
  return (
    <>
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
            <DialogDescription>Folders help keep uploads organized. Example: blog/2026.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Folder path"
              value={newFolderPath}
              onChange={(e) => setNewFolderPath(e.target.value)}
              disabled={creatingFolder}
            />
            <Input
              placeholder="Label (optional)"
              value={newFolderLabel}
              onChange={(e) => setNewFolderLabel(e.target.value)}
              disabled={creatingFolder}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateFolder(false)} disabled={creatingFolder}>
              Cancel
            </Button>
            <Button onClick={onCreateFolder} disabled={creatingFolder}>
              {creatingFolder ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editKey)} onOpenChange={(open: boolean) => (!open ? setEditKey(null) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
            <DialogDescription>Update the library metadata used for search and accessibility.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="File name" value={draftName} onChange={(e) => setDraftName(e.target.value)} disabled={saving} />
            <Input placeholder="Caption" value={draftCaption} onChange={(e) => setDraftCaption(e.target.value)} disabled={saving} />
            <Input placeholder="Alt text" value={draftAlt} onChange={(e) => setDraftAlt(e.target.value)} disabled={saving} />
            <Select value={draftFolder} onValueChange={setDraftFolder} disabled={saving}>
              <SelectTrigger>
                <SelectValue placeholder="Folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FOLDER_ROOT}>Root</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.path} value={folder.path}>
                    {folder.label ? `${folder.label} (${folder.path})` : folder.path}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditKey(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={onSaveEdit} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(previewKey)} onOpenChange={(open: boolean) => (!open ? setPreviewKey(null) : null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
            <DialogDescription>Preview the asset and copy its URL.</DialogDescription>
          </DialogHeader>
          {previewKey ? (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-xl border border-[var(--vd-border)] bg-[var(--vd-muted)]/20">
                <img
                  src={buildAssetImageUrl(previewKey, { width: 1600, fit: 'contain', quality: 90 })}
                  alt="Asset preview"
                  className="h-auto w-full"
                  loading="eager"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => onCopy(previewKey)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy URL
                </Button>
                <Button variant="outline" asChild>
                  <a href={buildAssetUrl(previewKey)} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open raw
                  </a>
                </Button>
                <Button variant="outline" onClick={() => onEditFromPreview(previewKey)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline" onClick={() => onDeleteFromPreview(previewKey)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
              <p className="text-xs text-[var(--vd-muted-fg)] break-all">{buildAssetUrl(previewKey)}</p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(confirmDeleteKeys)}
        onOpenChange={(open: boolean) => (!open ? setConfirmDeleteKeys(null) : null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete asset{confirmDeleteKeys && confirmDeleteKeys.length > 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the file from storage and the media library. If it is used on a page, the page will show a broken image.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
