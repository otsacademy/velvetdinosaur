/* eslint-disable @next/next/no-img-element -- asset picker supports arbitrary external URLs */
'use client';

import { useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { FolderPlus, Grid2X2, List, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type AssetFolderItem } from '@/lib/uploads';
import { AssetLibraryPreviewDialog } from './asset-library-preview-dialog';
import { AssetLibraryResults } from './asset-library-results';
import { FOLDER_ALL, FOLDER_ROOT, type AssetPickerListItem } from './shared';

export function AssetLibraryPanel({
  accept,
  busy,
  error,
  items,
  cursor,
  query,
  setQuery,
  testIdBase,
  folderFilter,
  setFolderFilter,
  folders,
  foldersLoading,
  uploadFolder,
  setUploadFolder,
  showCreateFolder,
  setShowCreateFolder,
  creatingFolder,
  newFolderPath,
  setNewFolderPath,
  newFolderLabel,
  setNewFolderLabel,
  uploadControls,
  onCreateFolder,
  onRefresh,
  onLoadMore,
  onUse,
  editingKey,
  startEditing,
  cancelEditing,
  saveEditing,
  draftName,
  setDraftName,
  draftCaption,
  setDraftCaption,
  draftAlt,
  setDraftAlt,
  draftFolder,
  setDraftFolder,
  savingKey
}: {
  accept: string;
  busy: boolean;
  error: string;
  items: AssetPickerListItem[];
  cursor: string | null;
  query: string;
  setQuery: (value: string) => void;
  testIdBase?: string;
  folderFilter: string;
  setFolderFilter: (value: string) => void;
  folders: AssetFolderItem[];
  foldersLoading: boolean;
  uploadFolder: string;
  setUploadFolder: (value: string) => void;
  showCreateFolder: boolean;
  setShowCreateFolder: Dispatch<SetStateAction<boolean>>;
  creatingFolder: boolean;
  newFolderPath: string;
  setNewFolderPath: (value: string) => void;
  newFolderLabel: string;
  setNewFolderLabel: (value: string) => void;
  uploadControls?: ReactNode;
  onCreateFolder: () => void;
  onRefresh: () => void;
  onLoadMore: () => void;
  onUse: (item: AssetPickerListItem) => void;
  editingKey: string | null;
  startEditing: (item: AssetPickerListItem) => void;
  cancelEditing: () => void;
  saveEditing: (key: string) => void;
  draftName: string;
  setDraftName: (value: string) => void;
  draftCaption: string;
  setDraftCaption: (value: string) => void;
  draftAlt: string;
  setDraftAlt: (value: string) => void;
  draftFolder: string;
  setDraftFolder: (value: string) => void;
  savingKey: string | null;
}) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewKey, setPreviewKey] = useState<string | null>(null);

  const previewItem = useMemo(
    () => items.find((item) => item.key === previewKey) ?? null,
    [items, previewKey]
  );

  return (
    <>
      <Card className="bg-white/75 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <p className="text-xs text-[var(--vd-muted-fg)]">
                Showing {items.length} result{items.length === 1 ? '' : 's'}
              </p>
            </div>

            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'list')}>
              <TabsList className="rounded-lg border border-[var(--vd-border)] bg-white/80 p-1">
                <TabsTrigger value="grid" aria-label="Grid view">
                  <Grid2X2 className="h-4 w-4" />
                  Grid
                </TabsTrigger>
                <TabsTrigger value="list" aria-label="List view">
                  <List className="h-4 w-4" />
                  List
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(220px,260px)_1fr_auto]">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-[var(--vd-muted-fg)]">Folder</p>
              <Select
                value={folderFilter}
                onValueChange={(value) => {
                  setFolderFilter(value);
                  if (value !== FOLDER_ALL) {
                    setUploadFolder(value);
                  }
                }}
                disabled={busy || foldersLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={foldersLoading ? 'Loading folders…' : 'Folder'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FOLDER_ALL}>All folders</SelectItem>
                  <SelectItem value={FOLDER_ROOT}>Root</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.path} value={folder.path}>
                      {folder.label ? `${folder.label} (${folder.path})` : folder.path}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-medium text-[var(--vd-muted-fg)]">Search</p>
              <Input
                placeholder="Search uploads by name or description"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                data-testid={testIdBase ? `asset-library-search-${testIdBase}` : 'asset-library-search'}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateFolder((open) => !open)}
                disabled={busy || creatingFolder}
              >
                <FolderPlus className="h-4 w-4" />
                New folder
              </Button>
              <Button variant="outline" onClick={onRefresh} disabled={busy}>
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {showCreateFolder ? (
            <div className="space-y-3 rounded-xl border border-[var(--vd-border)] bg-white/90 p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  placeholder="Folder path (e.g. blog/2026)"
                  value={newFolderPath}
                  onChange={(event) => setNewFolderPath(event.target.value)}
                  disabled={creatingFolder}
                />
                <Input
                  placeholder="Label (optional)"
                  value={newFolderLabel}
                  onChange={(event) => setNewFolderLabel(event.target.value)}
                  disabled={creatingFolder}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={onCreateFolder} disabled={creatingFolder}>
                  {creatingFolder ? 'Creating…' : 'Create folder'}
                </Button>
                <Button variant="ghost" onClick={() => setShowCreateFolder(false)} disabled={creatingFolder}>
                  Cancel
                </Button>
                <p className="text-xs text-[var(--vd-muted-fg)]">
                  New assets upload into <span className="font-medium text-[var(--vd-fg)]">{uploadFolder === FOLDER_ROOT ? 'root' : uploadFolder}</span>.
                </p>
              </div>
            </div>
          ) : null}

          {uploadControls}

          {error ? <p className="text-xs text-rose-600">{error}</p> : null}
        </CardHeader>

        <CardContent className="space-y-4">
          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--vd-border)] bg-[var(--vd-muted)]/15 px-4 py-10 text-center">
              <p className="text-sm font-medium text-[var(--vd-fg)]">No uploads found.</p>
              <p className="mt-1 text-xs text-[var(--vd-muted-fg)]">
                Try a different folder or search term, or upload a file above.
              </p>
            </div>
          ) : (
            <AssetLibraryResults
              accept={accept}
              items={items}
              viewMode={viewMode}
              folders={folders}
              editingKey={editingKey}
              startEditing={startEditing}
              cancelEditing={cancelEditing}
              saveEditing={saveEditing}
              draftName={draftName}
              setDraftName={setDraftName}
              draftCaption={draftCaption}
              setDraftCaption={setDraftCaption}
              draftAlt={draftAlt}
              setDraftAlt={setDraftAlt}
              draftFolder={draftFolder}
              setDraftFolder={setDraftFolder}
              savingKey={savingKey}
              testIdBase={testIdBase}
              onUse={onUse}
              onPreview={(item) => setPreviewKey(item.key)}
            />
          )}

          {cursor ? (
            <div className="flex justify-center">
              <Button variant="outline" onClick={onLoadMore} disabled={busy}>
                {busy ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <AssetLibraryPreviewDialog
        accept={accept}
        item={previewItem}
        open={Boolean(previewItem)}
        onOpenChange={(open) => {
          if (!open) setPreviewKey(null);
        }}
        onUse={(item) => {
          onUse(item);
          setPreviewKey(null);
        }}
        onEdit={startEditing}
      />
    </>
  );
}
