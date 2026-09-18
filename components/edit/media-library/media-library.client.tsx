'use client';
import Link from 'next/link';
import { toast } from 'sonner';
import { Grid2X2, List, Loader2, RotateCcw, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/dropzone';
import { MediaLibraryAssets } from './media-library.assets';
import { MediaLibraryBulkEditDialog } from './media-library.bulk-edit-dialog';
import { MediaLibraryDialogs } from './media-library.dialogs';
import { MediaLibrarySidebar } from './media-library.sidebar';
import { FOLDER_ROOT, TAG_FILTER_ALL, type MimeFilter, type SortMode, type ViewMode } from './media-library.types';
import { useMediaLibraryState, type MetadataFilter } from './media-library.state';
import { useMediaLibraryData } from './media-library.data';
import { useMediaLibraryActions } from './media-library.actions';
import { useMediaLibraryEditing } from './media-library.editing';

export function MediaLibraryClient() {
  const state = useMediaLibraryState();
  const data = useMediaLibraryData(state);
  const actions = useMediaLibraryActions(state, data);
  const editing = useMediaLibraryEditing(state, data);
  const { items, cursor, totalCount, loading, query, setQuery, viewMode, setViewMode, filter, setFilter, sort, setSort, folderFilter, tagFilter, setTagFilter, metadataFilter, setMetadataFilter, inTrashView, uploading, uploadProgress, uploadBatch, queuedFiles, setQueuedFiles, uploadPanelOpen, setUploadPanelOpen, uploadName, setUploadName, uploadCaption, setUploadCaption, uploadAlt, setUploadAlt, uploadTags, setUploadTags, uploadFolder, setUploadFolder, folders, foldersLoading, tags, tagsLoading, showCreateFolder, setShowCreateFolder, creatingFolder, newFolderPath, setNewFolderPath, newFolderLabel, setNewFolderLabel, newFolderDescription, setNewFolderDescription, showBulkMetadataEdit, setShowBulkMetadataEdit, bulkMetadataSaving, emptyingTrash, selectedKeys, bulkFolder, setBulkFolder, usageByKey, usageDialogKey, setUsageDialogKey, usageDialogLoading, usagePrefetching, deleteUsageLoading, previewKey, setPreviewKey, editKey, setEditKey, editItem, setEditItem, draftName, setDraftName, draftCaption, setDraftCaption, draftAlt, setDraftAlt, draftTags, setDraftTags, draftFolder, setDraftFolder, draftFocalX, setDraftFocalX, draftFocalY, setDraftFocalY, saving, replacingFile, confirmDeleteKeys, setConfirmDeleteKeys, altProviderInfo, altGenerationLoading, altApplying, altGenerationPreview, altGenerationError } = state;
  const { handleFolderFilterChange, fetchAssets, openUsageDialog, openDeleteConfirm, activeFolderLabel, usageCountByKey, previewPrevKey, previewNextKey, activeUsageDialogItem, deleteUsageReferences, activeEditItem, activeEditIsImage, hasUnsavedFocalChanges } = data;
  const { runQueuedUpload, handleCopy, toggleSelected, clearSelection, runDelete, runRestore, runEmptyTrash, runBulkMetadataEdit, runBulkMove, handleCreateFolder, handleEditFolder, handleDeleteFolder, handleDropToFolder, handleAssetDragStart, selectedArray, allVisibleSelected, someVisibleSelected, setSelectAllVisible } = actions;
  const { closeEditing, startEditing, saveEditing, handleReplaceFile, handleGenerateAlt, applyGeneratedAlt } = editing;
  return (
    <div className="mx-auto w-full max-w-[1280px] py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--vd-fg)]">Media Library</h1>
          <p className="mt-1 text-sm text-[var(--vd-muted-fg)]">Upload, organize, and reuse assets across your site.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/edit" prefetch={false}>
            Back to editor
          </Link>
        </Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <MediaLibrarySidebar
          folderFilter={folderFilter}
          onFolderChange={handleFolderFilterChange}
          folders={folders}
          foldersLoading={foldersLoading}
          onCreateFolder={() => setShowCreateFolder(true)}
          onEditFolder={(folder) => void handleEditFolder(folder)}
          onDeleteFolder={(folder) => void handleDeleteFolder(folder)}
          onDropToFolder={(path) => void handleDropToFolder(path)}
        />

        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-xl bg-white/80 p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-[var(--vd-muted-fg)]">Browsing</p>
              <p className="truncate text-sm font-semibold text-[var(--vd-fg)]">{activeFolderLabel}</p>
              <p className="mt-1 text-xs text-[var(--vd-muted-fg)]">
                Showing {items.length} of {totalCount} assets
              </p>
              {usagePrefetching && !inTrashView ? (
                <p className="mt-1 text-[11px] text-[var(--vd-muted-fg)]">Updating usage references…</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                className="w-full sm:w-[220px]"
                placeholder="Search by name, caption, tag, key"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Select value={filter} onValueChange={(value) => setFilter(value as MimeFilter)}>
                <SelectTrigger className="w-[140px]" aria-label="Filter by file type">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                </SelectContent>
              </Select>
              <Select value={tagFilter} onValueChange={setTagFilter} disabled={tagsLoading}>
                <SelectTrigger className="w-[180px]" aria-label="Filter by tag">
                  <SelectValue placeholder="Tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TAG_FILTER_ALL}>All tags</SelectItem>
                  {tags.map((tagItem) => (
                    <SelectItem key={tagItem.tag} value={tagItem.tag}>
                      {tagItem.tag} ({tagItem.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={metadataFilter} onValueChange={(value) => setMetadataFilter(value as MetadataFilter)}>
                <SelectTrigger className="w-[200px]" aria-label="Filter by metadata completeness">
                  <SelectValue placeholder="Metadata" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All metadata</SelectItem>
                  <SelectItem value="missing-caption">Missing caption</SelectItem>
                  <SelectItem value="missing-alt">Missing alt text</SelectItem>
                  <SelectItem value="missing-metadata">Missing caption or alt</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(value) => setSort(value as SortMode)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                </SelectContent>
              </Select>
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                <TabsList className="h-auto gap-2 rounded-none bg-transparent p-0">
                  <TabsTrigger
                    value="grid"
                    aria-label="Grid view"
                    className="rounded-none border-b-2 border-b-transparent px-1 py-1.5 data-[state=active]:border-b-[var(--vd-ring)] data-[state=active]:bg-transparent"
                  >
                    <Grid2X2 className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger
                    value="list"
                    aria-label="List view"
                    className="rounded-none border-b-2 border-b-transparent px-1 py-1.5 data-[state=active]:border-b-[var(--vd-ring)] data-[state=active]:bg-transparent"
                  >
                    <List className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <Card className="border-transparent shadow-sm">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-sm">{inTrashView ? 'Trash' : 'Uploads'}</CardTitle>
                {!inTrashView ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUploadPanelOpen((prev) => !prev)}
                    disabled={uploading}
                  >
                    {uploadPanelOpen ? 'Hide upload panel' : 'Upload'}
                  </Button>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--vd-border)]/60 bg-white/70 p-3">
                <div className="flex items-center gap-3 text-sm">
                  <Checkbox
                    checked={allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false}
                    onCheckedChange={setSelectAllVisible}
                    aria-label="Select all in current view"
                  />
                  <Badge className="bg-white text-[var(--vd-muted-fg)]">{selectedArray.length} selected</Badge>
                  {selectedArray.length ? (
                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                      Clear
                    </Button>
                  ) : null}
                </div>
                {selectedArray.length ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {inTrashView ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => void runRestore(selectedArray)}>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Restore
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => void openDeleteConfirm(selectedArray)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete permanently
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowBulkMetadataEdit(true)}
                        >
                          Bulk edit
                        </Button>
                        <Select value={bulkFolder} onValueChange={setBulkFolder}>
                          <SelectTrigger className="w-[220px]">
                            <SelectValue placeholder="Move to folder" />
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
                        <Button variant="outline" size="sm" onClick={() => void runBulkMove()}>
                          Move
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => void openDeleteConfirm(selectedArray)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Move to trash
                        </Button>
                      </>
                    )}
                  </div>
                ) : inTrashView ? (
                  <Button variant="outline" size="sm" onClick={() => void runEmptyTrash()} disabled={emptyingTrash || items.length === 0}>
                    {emptyingTrash ? 'Emptying…' : 'Empty trash'}
                  </Button>
                ) : null}
              </div>

              {inTrashView ? (
                <p className="text-xs text-[var(--vd-muted-fg)]">
                  Items in Trash can be restored anytime until they are permanently deleted.
                </p>
              ) : (
                <>
                  {!uploadPanelOpen ? (
                    <p className="text-xs text-[var(--vd-muted-fg)]">
                      Upload panel is collapsed. Click Upload to add files.
                    </p>
                  ) : (
                    <>
                      {uploadProgress !== null ? (
                        <div className="flex items-center gap-3 text-xs text-[var(--vd-muted-fg)]">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {uploadBatch ? `Uploading ${uploadBatch.current}/${uploadBatch.total} ` : null}
                          {uploadProgress}%
                        </div>
                      ) : null}

                      <Dropzone
                        src={queuedFiles || undefined}
                        onDrop={(acceptedFiles) => setQueuedFiles(acceptedFiles)}
                        accept={{
                          'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif'],
                          'application/pdf': ['.pdf']
                        }}
                        maxSize={25 * 1024 * 1024}
                        maxFiles={30}
                        disabled={uploading}
                        onError={(error) => toast.error(error.message)}
                        className="bg-white"
                      >
                        <DropzoneContent />
                        <DropzoneEmptyState />
                      </Dropzone>

                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        <Input
                          placeholder={queuedFiles && queuedFiles.length > 1 ? 'File name (single file only)' : 'File name (library)'}
                          value={uploadName}
                          onChange={(e) => setUploadName(e.target.value)}
                          disabled={uploading || Boolean(queuedFiles && queuedFiles.length > 1)}
                        />
                        <Input
                          placeholder="Caption (optional)"
                          value={uploadCaption}
                          onChange={(e) => setUploadCaption(e.target.value)}
                          disabled={uploading}
                        />
                        <Input
                          placeholder="Alt text (recommended)"
                          value={uploadAlt}
                          onChange={(e) => setUploadAlt(e.target.value)}
                          disabled={uploading}
                        />
                        <Input
                          placeholder="Tags (comma separated)"
                          value={uploadTags}
                          onChange={(e) => setUploadTags(e.target.value)}
                          disabled={uploading}
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Select value={uploadFolder} onValueChange={setUploadFolder} disabled={uploading}>
                          <SelectTrigger className="w-[260px]">
                            <SelectValue placeholder="Upload folder" />
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
                        <Button onClick={() => void runQueuedUpload()} disabled={uploading || !queuedFiles?.length}>
                          {uploading ? 'Uploading…' : queuedFiles?.length ? `Upload ${queuedFiles.length}` : 'Upload'}
                        </Button>
                        {queuedFiles?.length ? (
                          <Button variant="ghost" onClick={() => setQueuedFiles(null)} disabled={uploading}>
                            Clear selection
                          </Button>
                        ) : null}
                      </div>
                      <p className="text-xs text-[var(--vd-muted-fg)]">
                        Tip: keep names and alt text human. It improves search, accessibility, and reuse.
                      </p>
                    </>
                  )}
                </>
              )}
            </CardHeader>
            <CardContent>
              {items.length === 0 && !loading ? (
                <p className="text-sm text-[var(--vd-muted-fg)]">{inTrashView ? 'Trash is empty.' : 'No uploads found.'}</p>
              ) : (
                <MediaLibraryAssets
                  items={items}
                  viewMode={viewMode}
                  selectedKeys={selectedKeys}
                  onToggleSelected={toggleSelected}
                  onPreview={setPreviewKey}
                  onCopy={(key) => void handleCopy(key)}
                  onEdit={startEditing}
                  onRestore={(key) => void runRestore([key])}
                  inTrashView={inTrashView}
                  onDelete={(key) => void openDeleteConfirm([key])}
                  onDragStart={handleAssetDragStart}
                  usageCountByKey={usageCountByKey}
                  onOpenUsage={(key) => void openUsageDialog(key)}
                />
              )}

              <div className="mt-6 flex items-center justify-center">
                {cursor ? (
                  <Button variant="outline" onClick={() => void fetchAssets({ reset: false, cursor })} disabled={loading}>
                    {loading ? 'Loading…' : 'Load more'}
                  </Button>
                ) : items.length ? (
                  <p className="text-xs text-[var(--vd-muted-fg)]">No more results.</p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <MediaLibraryBulkEditDialog
        key={showBulkMetadataEdit ? 'bulk-edit-open' : 'bulk-edit-closed'}
        open={showBulkMetadataEdit}
        onOpenChange={setShowBulkMetadataEdit}
        selectedCount={selectedArray.length}
        saving={bulkMetadataSaving}
        onApply={(payload) => void runBulkMetadataEdit(payload)}
      />

      <MediaLibraryDialogs
        folders={folders}
        showCreateFolder={showCreateFolder}
        setShowCreateFolder={setShowCreateFolder}
        creatingFolder={creatingFolder}
        newFolderPath={newFolderPath}
        setNewFolderPath={setNewFolderPath}
        newFolderLabel={newFolderLabel}
        setNewFolderLabel={setNewFolderLabel}
        newFolderDescription={newFolderDescription}
        setNewFolderDescription={setNewFolderDescription}
        onCreateFolder={() => void handleCreateFolder()}
        editKey={editKey}
        setEditKey={closeEditing}
        editItem={activeEditItem}
        draftName={draftName}
        setDraftName={setDraftName}
        draftCaption={draftCaption}
        setDraftCaption={setDraftCaption}
        draftAlt={draftAlt}
        setDraftAlt={setDraftAlt}
        draftTags={draftTags}
        setDraftTags={setDraftTags}
        draftFolder={draftFolder}
        setDraftFolder={setDraftFolder}
        draftFocalX={draftFocalX}
        draftFocalY={draftFocalY}
        setDraftFocalX={setDraftFocalX}
        setDraftFocalY={setDraftFocalY}
        activeEditIsImage={activeEditIsImage}
        hasUnsavedFocalChanges={hasUnsavedFocalChanges}
        saving={saving}
        onSaveEdit={() => void saveEditing()}
        replacingFile={replacingFile}
        onReplaceFile={(file) => void handleReplaceFile(file)}
        altProviderInfo={altProviderInfo}
        altGenerationLoading={altGenerationLoading}
        altApplying={altApplying}
        altGenerationPreview={altGenerationPreview}
        altGenerationError={altGenerationError}
        onGenerateAlt={handleGenerateAlt}
        onApplyGeneratedAlt={applyGeneratedAlt}
        previewKey={previewKey}
        setPreviewKey={setPreviewKey}
        previewPrevKey={previewPrevKey}
        previewNextKey={previewNextKey}
        onNavigatePreview={setPreviewKey}
        previewUsageCount={previewKey ? usageByKey[previewKey]?.count || 0 : 0}
        onCopy={(key) => void handleCopy(key)}
        usageDialogKey={usageDialogKey}
        setUsageDialogKey={setUsageDialogKey}
        usageDialogItem={activeUsageDialogItem}
        usageDialogLoading={usageDialogLoading}
        onEditFromPreview={(key) => {
          const item = items.find((i) => i.key === key);
          if (item) startEditing(item);
          else {
            setEditKey(key);
            setEditItem(null);
            setDraftName('');
            setDraftCaption('');
            setDraftAlt('');
            setDraftTags('');
            setDraftFolder(FOLDER_ROOT);
            setDraftFocalX(undefined);
            setDraftFocalY(undefined);
          }
        }}
        onDeleteFromPreview={(key) => void openDeleteConfirm([key])}
        onRestoreFromPreview={(key) => void runRestore([key])}
        inTrashView={inTrashView}
        confirmDeleteKeys={confirmDeleteKeys}
        setConfirmDeleteKeys={setConfirmDeleteKeys}
        deleteUsageReferences={deleteUsageReferences}
        deleteUsageLoading={deleteUsageLoading}
        onConfirmDelete={() => void runDelete()}
      />
    </div>
  );
}
