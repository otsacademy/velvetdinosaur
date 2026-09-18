'use client';
import { useRef, useState } from 'react';
import type { AssetFolderItem, AssetUsageItem, AssetTagItem } from '@/lib/uploads';
import { FOLDER_ALL, FOLDER_ROOT, FOLDER_TRASH, TAG_FILTER_ALL, type AssetListItem, type MimeFilter, type SortMode, type ViewMode } from './media-library.types';
export type MetadataFilter = 'all' | 'missing-caption' | 'missing-alt' | 'missing-metadata';

export function useMediaLibraryState() {
  const [items, setItems] = useState<AssetListItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filter, setFilter] = useState<MimeFilter>('all');
  const [sort, setSort] = useState<SortMode>('newest');
  const [folderFilter, setFolderFilter] = useState<string>(FOLDER_ALL);
  const [tagFilter, setTagFilter] = useState<string>(TAG_FILTER_ALL);
  const [metadataFilter, setMetadataFilter] = useState<MetadataFilter>('all');
  const inTrashView = folderFilter === FOLDER_TRASH;

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadBatch, setUploadBatch] = useState<{ current: number; total: number } | null>(null);
  const [queuedFiles, setQueuedFiles] = useState<File[] | null>(null);
  const [uploadPanelOpen, setUploadPanelOpen] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadAlt, setUploadAlt] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadFolder, setUploadFolder] = useState<string>(FOLDER_ROOT);

  const [folders, setFolders] = useState<AssetFolderItem[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [tags, setTags] = useState<AssetTagItem[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);

  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderPath, setNewFolderPath] = useState('');
  const [newFolderLabel, setNewFolderLabel] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [showBulkMetadataEdit, setShowBulkMetadataEdit] = useState(false);
  const [bulkMetadataSaving, setBulkMetadataSaving] = useState(false);
  const [emptyingTrash, setEmptyingTrash] = useState(false);

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set());
  const [draggingKeys, setDraggingKeys] = useState<string[]>([]);
  const [bulkFolder, setBulkFolder] = useState<string>(FOLDER_ROOT);
  const lastSelectedIndexRef = useRef<number | null>(null);

  const [usageByKey, setUsageByKey] = useState<Record<string, AssetUsageItem>>({});
  const [usageDialogKey, setUsageDialogKey] = useState<string | null>(null);
  const [usageDialogLoading, setUsageDialogLoading] = useState(false);
  const [usagePrefetching, setUsagePrefetching] = useState(false);
  const [deleteUsageLoading, setDeleteUsageLoading] = useState(false);

  const [previewKey, setPreviewKey] = useState<string | null>(null);

  const [editKey, setEditKey] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<AssetListItem | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftCaption, setDraftCaption] = useState('');
  const [draftAlt, setDraftAlt] = useState('');
  const [draftTags, setDraftTags] = useState('');
  const [draftFolder, setDraftFolder] = useState<string>(FOLDER_ROOT);
  const [draftFocalX, setDraftFocalX] = useState<number | undefined>(undefined);
  const [draftFocalY, setDraftFocalY] = useState<number | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [replacingFile, setReplacingFile] = useState(false);

  const [confirmDeleteKeys, setConfirmDeleteKeys] = useState<string[] | null>(null);
  const [altProviderInfo, setAltProviderInfo] = useState<{ configured: boolean; envVar: string } | null>(null);
  const [altGenerationLoading, setAltGenerationLoading] = useState(false);
  const [altApplying, setAltApplying] = useState(false);
  const [altGenerationPreview, setAltGenerationPreview] = useState('');
  const [altGenerationError, setAltGenerationError] = useState('');

  return { items, setItems, cursor, setCursor, totalCount, setTotalCount, loading, setLoading, query, setQuery, viewMode, setViewMode, filter, setFilter, sort, setSort, folderFilter, setFolderFilter, tagFilter, setTagFilter, metadataFilter, setMetadataFilter, inTrashView, uploading, setUploading, uploadProgress, setUploadProgress, uploadBatch, setUploadBatch, queuedFiles, setQueuedFiles, uploadPanelOpen, setUploadPanelOpen, uploadName, setUploadName, uploadCaption, setUploadCaption, uploadAlt, setUploadAlt, uploadTags, setUploadTags, uploadFolder, setUploadFolder, folders, setFolders, foldersLoading, setFoldersLoading, tags, setTags, tagsLoading, setTagsLoading, showCreateFolder, setShowCreateFolder, creatingFolder, setCreatingFolder, newFolderPath, setNewFolderPath, newFolderLabel, setNewFolderLabel, newFolderDescription, setNewFolderDescription, showBulkMetadataEdit, setShowBulkMetadataEdit, bulkMetadataSaving, setBulkMetadataSaving, emptyingTrash, setEmptyingTrash, selectedKeys, setSelectedKeys, draggingKeys, setDraggingKeys, bulkFolder, setBulkFolder, lastSelectedIndexRef, usageByKey, setUsageByKey, usageDialogKey, setUsageDialogKey, usageDialogLoading, setUsageDialogLoading, usagePrefetching, setUsagePrefetching, deleteUsageLoading, setDeleteUsageLoading, previewKey, setPreviewKey, editKey, setEditKey, editItem, setEditItem, draftName, setDraftName, draftCaption, setDraftCaption, draftAlt, setDraftAlt, draftTags, setDraftTags, draftFolder, setDraftFolder, draftFocalX, setDraftFocalX, draftFocalY, setDraftFocalY, saving, setSaving, replacingFile, setReplacingFile, confirmDeleteKeys, setConfirmDeleteKeys, altProviderInfo, setAltProviderInfo, altGenerationLoading, setAltGenerationLoading, altApplying, setAltApplying, altGenerationPreview, setAltGenerationPreview, altGenerationError, setAltGenerationError };
}
export type MediaLibraryState = ReturnType<typeof useMediaLibraryState>;
