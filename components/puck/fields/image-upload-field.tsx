/* eslint-disable @next/next/no-img-element */
'use client';

import { type ChangeEvent, useRef, useState } from 'react';
import type { CustomField } from '@measured/puck';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { resolveAssetImageUrl, uploadFile } from '@/lib/uploads';
import { cn } from '@/lib/utils';

type ImageUploadFieldProps = {
  field: CustomField<string>;
  name: string;
  id: string;
  value?: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
};

export function ImageUploadField({ id, value, onChange, readOnly }: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');

  const resolvedValue = value ?? '';
  const previewSrc = previewUrl ?? resolveAssetImageUrl(resolvedValue, { width: 1200, height: 800, fit: 'cover' });

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are supported.');
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setIsUploading(true);
    setProgress(0);

    try {
      const uploaded = await uploadFile(file, {
        onProgress: (next) => setProgress(next),
        name: uploadName.trim() || file.name.replace(/\.[^/.]+$/, ''),
        caption: uploadCaption.trim() || undefined
      });
      onChange(uploaded.url);
      toast.success('Image uploaded.');
      setUploadName('');
      setUploadCaption('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to upload image.';
      toast.error(message);
    } finally {
      setIsUploading(false);
      setProgress(0);
      setPreviewUrl(null);
      URL.revokeObjectURL(localPreview);
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!uploadName.trim()) {
      setUploadName(file.name.replace(/\.[^/.]+$/, ''));
    }
    await handleUpload(file);
    event.target.value = '';
  };

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'overflow-hidden rounded-[var(--vd-radius)] border border-dashed border-[var(--vd-border)] bg-[var(--vd-muted)]',
          previewSrc ? 'p-0' : 'p-4 text-center text-xs text-[var(--vd-muted-fg)]'
        )}
        onDragOver={(event) => {
          if (readOnly || isUploading) return;
          event.preventDefault();
        }}
        onDrop={(event) => {
          if (readOnly || isUploading) return;
          event.preventDefault();
          const file = event.dataTransfer.files?.[0];
          if (!file) return;
          if (!uploadName.trim()) {
            setUploadName(file.name.replace(/\.[^/.]+$/, ''));
          }
          void handleUpload(file);
        }}
      >
        {previewSrc ? (
          <img
            src={previewSrc}
            alt="Uploaded preview"
            width={1200}
            height={800}
            className="h-auto w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          'Drop an image here, or upload below.'
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={Boolean(readOnly) || isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload image'}
        </Button>
        {resolvedValue ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onChange('')}
            disabled={Boolean(readOnly) || isUploading}
          >
            Remove
          </Button>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          placeholder="File name (for library)"
          value={uploadName}
          onChange={(event) => setUploadName(event.target.value)}
          disabled={Boolean(readOnly) || isUploading}
        />
        <Input
          placeholder="Caption (optional)"
          value={uploadCaption}
          onChange={(event) => setUploadCaption(event.target.value)}
          disabled={Boolean(readOnly) || isUploading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${id}-url`}>Image URL</Label>
        <Input
          id={`${id}-url`}
          type="url"
          placeholder="https://..."
          value={resolvedValue}
          onChange={(event) => onChange(event.target.value)}
          disabled={Boolean(readOnly) || isUploading}
        />
      </div>

      {isUploading ? (
        <div className="space-y-1">
          <Progress value={progress} />
          <div className="text-xs text-[var(--vd-muted-fg)]">Uploading... {progress}%</div>
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={Boolean(readOnly) || isUploading}
      />
    </div>
  );
}
