'use client';

import * as React from 'react';
import { createUsePuck, type ComponentData, type Data } from '@puckeditor/core';
import { ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { uploadFile } from '@/lib/uploads';
import { cn } from '@/lib/utils';
import { readImageDimensions } from '@/components/puck/fields/asset-picker-field/shared';
import { buildId } from '@/components/puck/editor/puck-editor-shell-utils';

const ROOT_ZONE = 'root:default-zone';

type UploadedCanvasImage = {
  url: string;
  alt: string;
};

type ImageDropTarget =
  | {
      kind: 'replace-image';
      id: string;
    }
  | {
      kind: 'insert';
    };

const usePuckStore = createUsePuck();

function getImageFiles(dataTransfer: DataTransfer) {
  return Array.from(dataTransfer.files || []).filter((file) => file.type.startsWith('image/'));
}

function fileLabel(file: File) {
  return file.name.replace(/\.[^/.]+$/, '').trim() || 'Uploaded image';
}

function getItemId(item: unknown) {
  if (!item || typeof item !== 'object') return null;
  const props = (item as { props?: unknown }).props;
  if (!props || typeof props !== 'object') return null;
  const id = (props as { id?: unknown }).id;
  return typeof id === 'string' && id.trim() ? id : null;
}

function getZoneContent(data: Data, zone: string): ComponentData[] {
  if (zone === ROOT_ZONE) {
    return Array.isArray(data.content) ? (data.content as ComponentData[]) : [];
  }
  const zones = data.zones || {};
  const content = zones[zone];
  return Array.isArray(content) ? (content as ComponentData[]) : [];
}

function setZoneContent(data: Data, zone: string, content: ComponentData[]): Data {
  if (zone === ROOT_ZONE) {
    return {
      ...data,
      content
    };
  }

  return {
    ...data,
    zones: {
      ...(data.zones || {}),
      [zone]: content
    }
  };
}

function createImageBlock(image: UploadedCanvasImage, index: number): ComponentData {
  return {
    type: 'Image',
    props: {
      id: buildId('Image', index),
      src: image.url,
      alt: image.alt,
      caption: ''
    }
  };
}

function replaceImageBlock(block: ComponentData, image: UploadedCanvasImage): ComponentData {
  return {
    ...block,
    props: {
      ...(block.props || {}),
      src: image.url,
      alt: image.alt
    }
  };
}

function resolveDropTarget(event: React.DragEvent<HTMLDivElement>): ImageDropTarget {
  const target = event.target instanceof Element ? event.target : null;
  const imageBlock = target?.closest<HTMLElement>('[data-puck-image-block-id]');
  const id = imageBlock?.dataset.puckImageBlockId;

  if (id) {
    return {
      kind: 'replace-image',
      id
    };
  }

  return { kind: 'insert' };
}

export function CanvasImageDropZone({
  children,
  disabled = false,
  className
}: {
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const dispatch = usePuckStore((state) => state.dispatch);
  const selectedItem = usePuckStore((state) => state.selectedItem);
  const getSelectorForId = usePuckStore((state) => state.getSelectorForId);
  const getItemById = usePuckStore((state) => state.getItemById);
  const [isDraggingFile, setIsDraggingFile] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  const uploadImages = React.useCallback(async (files: File[]) => {
    const uploaded: UploadedCanvasImage[] = [];

    for (const file of files) {
      const dims = await readImageDimensions(file);
      const label = fileLabel(file);
      const result = await uploadFile(file, {
        name: label,
        alt: label,
        width: dims.width,
        height: dims.height
      });
      uploaded.push({
        url: result.url,
        alt: result.alt?.trim() || label
      });
    }

    return uploaded;
  }, []);

  const applyImages = React.useCallback(
    (images: UploadedCanvasImage[], target: ImageDropTarget) => {
      if (!images.length) return;

      const selectedId = getItemId(selectedItem);
      const selectedSelector = selectedId ? getSelectorForId(selectedId) : undefined;
      const targetItem = target.kind === 'replace-image' ? getItemById(target.id) : undefined;
      const targetSelector =
        target.kind === 'replace-image' && targetItem?.type === 'Image'
          ? getSelectorForId(target.id)
          : undefined;

      dispatch({
        type: 'setData',
        data: (currentData) => {
          const zone = targetSelector?.zone || selectedSelector?.zone || ROOT_ZONE;
          const currentContent = getZoneContent(currentData, zone);
          const nextContent = [...currentContent];

          if (targetSelector) {
            const existing = nextContent[targetSelector.index];
            if (!existing) return currentData;

            nextContent[targetSelector.index] = replaceImageBlock(existing, images[0]);
            const remaining = images.slice(1).map((image, index) => createImageBlock(image, index));
            if (remaining.length) {
              nextContent.splice(targetSelector.index + 1, 0, ...remaining);
            }
            return setZoneContent(currentData, zone, nextContent);
          }

          const insertIndex =
            selectedSelector && selectedSelector.zone === zone
              ? selectedSelector.index + 1
              : nextContent.length;
          const imageBlocks = images.map((image, index) => createImageBlock(image, index));
          nextContent.splice(insertIndex, 0, ...imageBlocks);
          return setZoneContent(currentData, zone, nextContent);
        },
        recordHistory: true
      });
    },
    [dispatch, getItemById, getSelectorForId, selectedItem]
  );

  const handleDragOver = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (disabled || isUploading) return;
      const hasFiles = Array.from(event.dataTransfer.types || []).includes('Files');
      if (!hasFiles) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      setIsDraggingFile(true);
    },
    [disabled, isUploading]
  );

  const handleDrop = React.useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      if (disabled || isUploading) return;
      const files = getImageFiles(event.dataTransfer);
      if (!files.length) return;

      event.preventDefault();
      event.stopPropagation();
      setIsDraggingFile(false);
      setIsUploading(true);

      try {
        const target = resolveDropTarget(event);
        const uploaded = await uploadImages(files);
        applyImages(uploaded, target);
        toast.success(
          uploaded.length === 1
            ? 'Image uploaded and inserted.'
            : `${uploaded.length} images uploaded and inserted.`
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to upload image.';
        toast.error(message);
      } finally {
        setIsUploading(false);
      }
    },
    [applyImages, disabled, isUploading, uploadImages]
  );

  return (
    <div
      className={cn('relative h-full min-h-0', className)}
      data-testid="puck-canvas-image-drop-zone"
      onDragEnter={(event) => {
        if (disabled || isUploading) return;
        if (Array.from(event.dataTransfer.types || []).includes('Files')) {
          setIsDraggingFile(true);
        }
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsDraggingFile(false);
        }
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
      {isDraggingFile || isUploading ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-xl border border-dashed border-[var(--vd-primary)] bg-[var(--vd-primary)]/8 text-[var(--vd-primary)]">
          <div className="flex items-center gap-2 rounded-full border border-[var(--vd-primary)]/25 bg-[var(--vd-bg)] px-3 py-2 text-xs font-medium shadow-sm">
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
            {isUploading ? 'Uploading images...' : 'Drop images to add them'}
          </div>
        </div>
      ) : null}
    </div>
  );
}
