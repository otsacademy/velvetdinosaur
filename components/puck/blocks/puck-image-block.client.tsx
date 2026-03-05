'use client';

import { type ChangeEvent, useRef, useState } from 'react';
import { createUsePuck } from '@measured/puck';
import { toast } from 'sonner';
import { ImageBlock, type ImageBlockProps } from '@/components/blocks/image-block';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { uploadFile } from '@/lib/uploads';
import { cn } from '@/lib/utils';

type PuckImageBlockProps = ImageBlockProps & {
  id: string;
  editMode?: boolean;
  puck?: { isEditing?: boolean };
};

const usePuckStore = createUsePuck();

export function PuckImageBlock({ id, editMode, puck, ...imageProps }: PuckImageBlockProps) {
  const dispatch = usePuckStore((state) => state.dispatch);
  const getSelectorForId = usePuckStore((state) => state.getSelectorForId);
  const getItemById = usePuckStore((state) => state.getItemById);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const canEdit = Boolean(puck?.isEditing ?? editMode);

  const updateImage = (nextUrl: string) => {
    const item = getItemById(id);
    const selector = getSelectorForId(id);
    if (!item || !selector) return;

    dispatch({
      type: 'replace',
      destinationIndex: selector.index,
      destinationZone: selector.zone,
      data: {
        ...item,
        props: {
          ...item.props,
          src: nextUrl
        }
      },
      recordHistory: true
    });
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are supported.');
      event.target.value = '';
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const uploaded = await uploadFile(file, {
        onProgress: (next) => setProgress(next)
      });
      updateImage(uploaded.url);
      toast.success('Image updated.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to upload image.';
      toast.error(message);
    } finally {
      setIsUploading(false);
      setProgress(0);
      event.target.value = '';
    }
  };

  const openFilePicker = (event?: React.MouseEvent | React.KeyboardEvent) => {
    event?.preventDefault();
    event?.stopPropagation();
    if (!canEdit || isUploading) return;
    fileInputRef.current?.click();
  };

  if (!imageProps.src) {
    return (
      <Card className="border-dashed border-[var(--vd-border)] bg-[var(--vd-muted)]">
        <div className="flex flex-col items-center gap-3 px-6 py-10 text-center text-sm text-[var(--vd-muted-fg)]">
          <div>Upload an image to get started.</div>
          <Button size="sm" onClick={openFilePicker} disabled={!canEdit || isUploading}>
            {isUploading ? 'Uploading...' : 'Upload image'}
          </Button>
          {isUploading ? (
            <div className="w-full max-w-xs space-y-1">
              <Progress value={progress} />
              <div className="text-xs text-[var(--vd-muted-fg)]">Uploading... {progress}%</div>
            </div>
          ) : null}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={!canEdit || isUploading}
        />
      </Card>
    );
  }

  return (
    <div className={cn('group relative')} onDoubleClick={(event) => openFilePicker(event)}>
      <ImageBlock {...imageProps} />
      {canEdit ? (
        <div className="pointer-events-none absolute inset-0 flex items-start justify-end p-3">
          <Button
            size="sm"
            variant="outline"
            className="pointer-events-auto shadow-sm"
            onClick={openFilePicker}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Replace image'}
          </Button>
        </div>
      ) : null}
      {isUploading ? (
        <div className="absolute inset-x-3 bottom-3 rounded-md bg-[var(--vd-bg)] p-2">
          <Progress value={progress} />
        </div>
      ) : null}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={!canEdit || isUploading}
      />
    </div>
  );
}
