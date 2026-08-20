/* eslint-disable @next/next/no-img-element -- Media library supports arbitrary external URLs */
'use client';

import { Copy, Download, ExternalLink, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { buildAssetImageUrl, buildAssetUrl, type AssetFolderItem, type AssetUsageItem } from '@/lib/uploads';
import { buildFocalAwareAssetUrl } from '@/lib/media/focal-point';
import { FocalPointPicker } from './focal-point-picker.client';
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
  newFolderDescription,
  setNewFolderDescription,
  onCreateFolder,
  editKey,
  setEditKey,
  editItem,
  draftName,
  setDraftName,
  draftCaption,
  setDraftCaption,
  draftAlt,
  setDraftAlt,
  draftTags,
  setDraftTags,
  draftFolder,
  setDraftFolder,
  draftFocalX,
  draftFocalY,
  setDraftFocalX,
  setDraftFocalY,
  activeEditIsImage,
  hasUnsavedFocalChanges,
  saving,
  onSaveEdit,
  replacingFile,
  onReplaceFile,
  previewKey,
  setPreviewKey,
  previewPrevKey,
  previewNextKey,
  onNavigatePreview,
  previewUsageCount,
  onCopy,
  usageDialogKey,
  setUsageDialogKey,
  usageDialogItem,
  usageDialogLoading,
  onEditFromPreview,
  onDeleteFromPreview,
  onRestoreFromPreview,
  inTrashView,
  confirmDeleteKeys,
  setConfirmDeleteKeys,
  deleteUsageReferences,
  deleteUsageLoading,
  onConfirmDelete,
  altProviderInfo,
  altGenerationLoading,
  altApplying,
  altGenerationPreview,
  altGenerationError,
  onGenerateAlt,
  onApplyGeneratedAlt
}: {
  folders: AssetFolderItem[];
  showCreateFolder: boolean;
  setShowCreateFolder: (open: boolean) => void;
  creatingFolder: boolean;
  newFolderPath: string;
  setNewFolderPath: (value: string) => void;
  newFolderLabel: string;
  setNewFolderLabel: (value: string) => void;
  newFolderDescription: string;
  setNewFolderDescription: (value: string) => void;
  onCreateFolder: () => void;
  editKey: string | null;
  setEditKey: () => void;
  editItem: AssetListItem | null;
  draftName: string;
  setDraftName: (value: string) => void;
  draftCaption: string;
  setDraftCaption: (value: string) => void;
  draftAlt: string;
  setDraftAlt: (value: string) => void;
  draftTags: string;
  setDraftTags: (value: string) => void;
  draftFolder: string;
  setDraftFolder: (value: string) => void;
  draftFocalX?: number;
  draftFocalY?: number;
  setDraftFocalX: (value: number | undefined) => void;
  setDraftFocalY: (value: number | undefined) => void;
  activeEditIsImage: boolean;
  hasUnsavedFocalChanges: boolean;
  saving: boolean;
  onSaveEdit: () => void;
  replacingFile: boolean;
  onReplaceFile: (file: File) => void;
  previewKey: string | null;
  setPreviewKey: (value: string | null) => void;
  previewPrevKey: string | null;
  previewNextKey: string | null;
  onNavigatePreview: (key: string) => void;
  previewUsageCount: number;
  onCopy: (key: string) => void;
  usageDialogKey: string | null;
  setUsageDialogKey: (value: string | null) => void;
  usageDialogItem: AssetUsageItem | null;
  usageDialogLoading: boolean;
  onEditFromPreview: (key: string) => void;
  onDeleteFromPreview: (key: string) => void;
  onRestoreFromPreview: (key: string) => void;
  inTrashView: boolean;
  confirmDeleteKeys: string[] | null;
  setConfirmDeleteKeys: (keys: string[] | null) => void;
  deleteUsageReferences: Array<{ id: string; title: string; type: 'page' | 'article'; status?: string; url: string; assets: string[] }>;
  deleteUsageLoading: boolean;
  onConfirmDelete: () => void;
  altProviderInfo: { configured: boolean; envVar: string } | null;
  altGenerationLoading: boolean;
  altApplying: boolean;
  altGenerationPreview: string;
  altGenerationError: string;
  onGenerateAlt: () => void;
  onApplyGeneratedAlt: () => void;
}) {
  const focalImageSrc = editItem?.key
      ? buildFocalAwareAssetUrl(buildAssetImageUrl(editItem.key, { width: 760, height: 430, fit: 'cover', quality: 85 }), {
          focalX: draftFocalX,
          focalY: draftFocalY
        })
    : '';
  const providerConfigured = altProviderInfo?.configured ?? false;
  const altStatus =
    editItem?.altSource === 'manual'
      ? 'Manual'
      : editItem?.altNeedsReview
        ? 'Needs review'
        : editItem?.altSource === 'auto'
          ? 'Auto-generated'
          : 'Needs review';

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
            <Input
              placeholder="Description (optional)"
              value={newFolderDescription}
              onChange={(e) => setNewFolderDescription(e.target.value)}
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

      <Dialog open={Boolean(editKey)} onOpenChange={(open: boolean) => (!open ? setEditKey() : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
            <DialogDescription>Update the library metadata used for search and accessibility.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="File name" value={draftName} onChange={(e) => setDraftName(e.target.value)} disabled={saving} />
            <Input placeholder="Caption" value={draftCaption} onChange={(e) => setDraftCaption(e.target.value)} disabled={saving} />
            <Input placeholder="Alt text" value={draftAlt} onChange={(e) => setDraftAlt(e.target.value)} disabled={saving} />
            <Input
              placeholder="Tags (comma separated)"
              value={draftTags}
              onChange={(e) => setDraftTags(e.target.value)}
              disabled={saving}
            />
            <div className="space-y-2 rounded-lg border border-[var(--vd-border)]/70 p-3">
              <p className="text-sm font-medium text-[var(--vd-fg)]">Replace file</p>
              <Input
                type="file"
                accept={activeEditIsImage ? 'image/*' : undefined}
                disabled={saving || replacingFile}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onReplaceFile(file);
                  event.currentTarget.value = '';
                }}
              />
              <p className="text-xs text-[var(--vd-muted-fg)]">
                Replaces the underlying file while keeping the same URL and existing references.
              </p>
            </div>
            {activeEditIsImage ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{altStatus}</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onGenerateAlt}
                    disabled={
                      saving ||
                      altGenerationLoading ||
                      altApplying ||
                      editItem?.altSource === 'manual' ||
                      !providerConfigured
                    }
                  >
                    {altGenerationLoading ? 'Generating…' : 'Generate alt text'}
                  </Button>
                </div>
                {editItem?.altSource === 'manual' ? (
                  <p className="text-xs text-[var(--vd-muted-fg)]">
                    Manual alt text is enabled. Automatic generation is disabled to avoid overwriting edits.
                  </p>
                ) : !providerConfigured ? (
                  <p className="text-xs text-[var(--vd-muted-fg)]">
                    Provider not configured. Configure {altProviderInfo?.envVar || 'OPENAI_API_KEY'} to enable generation.
                  </p>
                ) : null}
                {altGenerationError ? <p className="text-xs text-red-600">{altGenerationError}</p> : null}
                {altGenerationPreview ? (
                  <div className="space-y-2">
                    <p className="text-xs text-[var(--vd-muted-fg)]">Preview</p>
                    <Input value={altGenerationPreview} readOnly />
                    <Button
                      size="sm"
                      onClick={onApplyGeneratedAlt}
                      disabled={saving || altApplying || altGenerationLoading}
                    >
                      {altApplying ? 'Applying…' : 'Apply'}
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}
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
            {editItem && activeEditIsImage && focalImageSrc ? (
              <div className="space-y-2">
                <FocalPointPicker
                  imageUrl={focalImageSrc}
                  focalX={draftFocalX}
                  focalY={draftFocalY}
                  onChange={({ focalX, focalY }) => {
                    setDraftFocalX(focalX);
                    setDraftFocalY(focalY);
                  }}
                  onReset={() => {
                    setDraftFocalX(0.5);
                    setDraftFocalY(0.5);
                  }}
                  disabled={saving}
                />
                <p className="text-xs text-[var(--vd-muted-fg)]">
                  Set the focus area for smart cropping across responsive layouts.
                </p>
                {hasUnsavedFocalChanges ? <p className="text-xs text-[var(--vd-muted-fg)]">Unsaved changes</p> : null}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditKey()} disabled={saving}>
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
            <DialogDescription>Preview the asset, navigate, and reuse its URL.</DialogDescription>
          </DialogHeader>
          {previewKey ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!previewPrevKey}
                  onClick={() => (previewPrevKey ? onNavigatePreview(previewPrevKey) : null)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!previewNextKey}
                  onClick={() => (previewNextKey ? onNavigatePreview(previewNextKey) : null)}
                >
                  Next
                </Button>
              </div>
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
                  <a href={buildAssetUrl(previewKey)} download>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </a>
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
                {!inTrashView ? (
                  <Button variant="outline" onClick={() => setUsageDialogKey(previewKey)}>
                    Used in {previewUsageCount}
                  </Button>
                ) : null}
                {inTrashView ? (
                  <Button variant="outline" onClick={() => onRestoreFromPreview(previewKey)}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restore
                  </Button>
                ) : null}
                <Button variant="outline" onClick={() => onDeleteFromPreview(previewKey)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {inTrashView ? 'Delete permanently' : 'Move to trash'}
                </Button>
              </div>
              <p className="text-xs text-[var(--vd-muted-fg)] break-all">{buildAssetUrl(previewKey)}</p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(usageDialogKey)} onOpenChange={(open: boolean) => (!open ? setUsageDialogKey(null) : null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Asset references</DialogTitle>
            <DialogDescription>Pages and articles currently using this asset.</DialogDescription>
          </DialogHeader>
          {usageDialogLoading ? (
            <p className="text-sm text-[var(--vd-muted-fg)]">Loading references…</p>
          ) : usageDialogItem && usageDialogItem.references.length > 0 ? (
            <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
              {usageDialogItem.references.map((reference) => (
                <div key={reference.id} className="rounded-lg border border-[var(--vd-border)]/70 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-[var(--vd-fg)]">{reference.title}</p>
                    <Badge variant="outline">{reference.type === 'page' ? 'Page' : 'Article'}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-[var(--vd-muted-fg)]">
                    {reference.status ? `${reference.status} · ` : null}
                    {reference.url}
                  </p>
                  <a
                    href={reference.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex text-xs text-[var(--vd-primary)] underline underline-offset-2"
                  >
                    Open
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--vd-muted-fg)]">No references found for this asset.</p>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(confirmDeleteKeys)}
        onOpenChange={(open: boolean) => (!open ? setConfirmDeleteKeys(null) : null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {inTrashView ? 'Delete permanently' : 'Move to trash'}
              {confirmDeleteKeys && confirmDeleteKeys.length > 1 ? ' assets' : ' asset'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {inTrashView
                ? 'This permanently removes the file from storage. This cannot be undone.'
                : 'The asset will move to Trash. You can restore it later or delete it permanently from Trash.'}
            </AlertDialogDescription>
            {deleteUsageLoading ? (
              <p className="text-sm text-[var(--vd-muted-fg)]">Checking references…</p>
            ) : deleteUsageReferences.length > 0 ? (
              <div className="space-y-2 rounded-lg border border-amber-300/70 bg-amber-50/60 p-3">
                <p className="text-sm font-medium text-amber-800">
                  Warning: this asset is currently used in {deleteUsageReferences.length} place
                  {deleteUsageReferences.length === 1 ? '' : 's'}.
                </p>
                <div className="max-h-36 space-y-1 overflow-y-auto pr-1">
                  {deleteUsageReferences.slice(0, 8).map((reference) => (
                    <p key={reference.id} className="text-xs text-amber-900">
                      {reference.type === 'page' ? 'Page' : 'Article'}: {reference.title}
                    </p>
                  ))}
                  {deleteUsageReferences.length > 8 ? (
                    <p className="text-xs text-amber-900">…and {deleteUsageReferences.length - 8} more</p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete}>
              {inTrashView ? 'Delete permanently' : 'Move to trash'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
