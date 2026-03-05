/* eslint-disable @next/next/no-img-element -- asset picker supports arbitrary external URLs */
'use client';

import type { Dispatch, SetStateAction } from 'react';
import { Check, Image as ImageIcon, Pencil, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { buildAssetImageUrl, buildAssetUrl, type AssetFolderItem } from '@/lib/uploads';

export type AssetPickerListItem = {
  key: string;
  name?: string;
  caption?: string;
  alt?: string;
  folder?: string;
  mime?: string;
  size?: number;
  width?: number;
  height?: number;
  createdAt?: string;
};

const FOLDER_ALL = '__all__';
const FOLDER_ROOT = '__root__';

export function resolveFolderParam(value: string) {
  if (value === FOLDER_ALL) return null;
  if (value === FOLDER_ROOT) return '';
  return value;
}

export function AssetLibraryPanel({
  accept,
  busy,
  error,
  items,
  cursor,
  query,
  setQuery,
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
  onCreateFolder: () => void;
  onRefresh: () => void;
  onLoadMore: () => void;
  onUse: (key: string) => void;
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
  return (
    <Card className="bg-white/70">
      <CardHeader className="space-y-2">
        <CardTitle className="text-sm">Asset library</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-[180px] flex-1">
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
              <SelectTrigger className="mt-1">
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
          <Button variant="outline" onClick={() => setShowCreateFolder((v) => !v)} disabled={busy || creatingFolder}>
            New folder
          </Button>
        </div>
        {showCreateFolder ? (
          <div className="rounded-md border border-[var(--vd-border)] bg-white/80 p-3 space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="Folder path (e.g. blog/2026)"
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
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onCreateFolder} disabled={creatingFolder}>
                {creatingFolder ? 'Creating…' : 'Create folder'}
              </Button>
              <Button variant="ghost" onClick={() => setShowCreateFolder(false)} disabled={creatingFolder}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <Input placeholder="Search uploads" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Button variant="outline" onClick={onRefresh} disabled={busy}>
            Search
          </Button>
          <Button variant="outline" onClick={onRefresh} disabled={busy}>
            Refresh library
          </Button>
        </div>
        {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-[var(--vd-muted-fg)]">No uploads found.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const isImage = (item.mime || '').startsWith('image/') || (!item.mime && accept.startsWith('image/'));
              const isEditing = editingKey === item.key;
              return (
                <div
                  key={item.key}
                  className="flex items-center gap-3 rounded-lg border border-[var(--vd-border)] bg-white/80 p-2"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-[var(--vd-muted)]/50">
                    {isImage ? (
                      <img
                        src={buildAssetImageUrl(item.key, { width: 112, height: 112, fit: 'cover' })}
                        alt={item.alt || item.name || 'Asset preview'}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[var(--vd-muted-fg)]">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          placeholder="File name"
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          disabled={savingKey === item.key}
                        />
                        <Input
                          placeholder="Caption"
                          value={draftCaption}
                          onChange={(e) => setDraftCaption(e.target.value)}
                          disabled={savingKey === item.key}
                        />
                        <Input
                          placeholder="Alt text"
                          value={draftAlt}
                          onChange={(e) => setDraftAlt(e.target.value)}
                          disabled={savingKey === item.key}
                        />
                        <Select value={draftFolder} onValueChange={setDraftFolder} disabled={savingKey === item.key}>
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
                    ) : (
                      <>
                        <p className="truncate text-xs font-medium text-[var(--vd-fg)]">{item.name || item.key}</p>
                        <p className="mt-1 truncate text-[11px] text-[var(--vd-muted-fg)]">
                          {item.caption || 'No description'}
                        </p>
                      </>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge className="bg-white text-[var(--vd-muted-fg)]">{item.folder ? `folder: ${item.folder}` : 'root'}</Badge>
                      {item.width && item.height ? (
                        <Badge className="bg-white text-[var(--vd-muted-fg)]">
                          {item.width}×{item.height}
                        </Badge>
                      ) : null}
                      {item.mime ? <Badge className="bg-white text-[var(--vd-muted-fg)]">{item.mime}</Badge> : null}
                      {typeof item.size === 'number' ? (
                        <Badge className="bg-white text-[var(--vd-muted-fg)]">{Math.round(item.size / 1024)}kb</Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <Button size="sm" variant="outline" onClick={() => saveEditing(item.key)} disabled={savingKey === item.key}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEditing}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => onUse(item.key)}>
                          Use
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => startEditing(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {cursor ? (
          <Button variant="outline" onClick={onLoadMore} disabled={busy}>
            Load more
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
