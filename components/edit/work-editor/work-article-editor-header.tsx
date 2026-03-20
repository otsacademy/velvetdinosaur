'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  Image as ImageIcon,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
  Paperclip,
  Video,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

type WorkArticleEditorHeaderProps = {
  returnPath: string
  isEditing: boolean
  mediaBusy: boolean
  showSettings: boolean
  previewHref: string | null
  isSubmitting: boolean
  onUploadImage: () => void
  onPickImage: () => void
  onInsertVideo: () => void
  onUploadFile: () => void
  onPickFile: () => void
  onToggleSettings: () => void
  onSubmit: () => void
}

export function WorkArticleEditorHeader({
  returnPath,
  isEditing,
  mediaBusy,
  showSettings,
  previewHref,
  isSubmitting,
  onUploadImage,
  onPickImage,
  onInsertVideo,
  onUploadFile,
  onPickFile,
  onToggleSettings,
  onSubmit,
}: WorkArticleEditorHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex w-full max-w-[1500px] flex-wrap items-center justify-between gap-2 px-3 py-2 lg:px-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={returnPath}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <span className="text-xs text-muted-foreground">
            {isEditing ? 'Editing case study draft (Potion template)' : 'New case study draft (Potion template)'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onUploadImage} disabled={mediaBusy}>
            <ImageIcon className="h-4 w-4" />
            Add image
          </Button>
          <Button variant="outline" size="sm" onClick={onPickImage} disabled={mediaBusy}>
            <ImageIcon className="h-4 w-4" />
            Media gallery
          </Button>
          <Button variant="outline" size="sm" onClick={onInsertVideo}>
            <Video className="h-4 w-4" />
            Add video
          </Button>
          <Button variant="outline" size="sm" onClick={onUploadFile} disabled={mediaBusy}>
            <Paperclip className="h-4 w-4" />
            Add file
          </Button>
          <Button variant="outline" size="sm" onClick={onPickFile} disabled={mediaBusy}>
            <Paperclip className="h-4 w-4" />
            Pick file
          </Button>
          <Button variant="ghost" size="sm" onClick={onToggleSettings}>
            {showSettings ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            {showSettings ? 'Hide settings' : 'Show settings'}
          </Button>
          {previewHref ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={previewHref} target="_blank" rel="noreferrer">
                Preview draft
              </Link>
            </Button>
          ) : null}
          <Button onClick={onSubmit} disabled={isSubmitting || mediaBusy}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isEditing ? 'Update article' : 'Publish article'}
          </Button>
        </div>
      </div>
    </header>
  )
}
