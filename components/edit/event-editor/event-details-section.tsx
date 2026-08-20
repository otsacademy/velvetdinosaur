'use client'

import { useMemo } from 'react'

import { CollapsibleAssetField } from '@/components/edit/collapsible-asset-field'
import { EventEditorSectionShell } from '@/components/edit/event-editor/event-editor-section-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { EVENT_CATEGORIES, type EventStatus } from '@/lib/events'
import { slugifyArticleTitle } from '@/lib/news-slug'

type EventDetailsSectionProps = {
  title: string
  onTitleChange: (value: string) => void
  slug: string
  onSlugChange: (value: string) => void
  onSlugUnlock: () => void
  category: string
  onCategoryChange: (value: string) => void
  organizer: string
  onOrganizerChange: (value: string) => void
  description: string
  onDescriptionChange: (value: string) => void
  heroImage: string
  onHeroImageChange: (value: string) => void
  tagsInput: string
  onTagsInputChange: (value: string) => void
  featured: boolean
  onFeaturedChange: (value: boolean) => void
  status: EventStatus
  onStatusChange: (value: EventStatus) => void
}

export function EventDetailsSection({
  title,
  onTitleChange,
  slug,
  onSlugChange,
  onSlugUnlock,
  category,
  onCategoryChange,
  organizer,
  onOrganizerChange,
  description,
  onDescriptionChange,
  heroImage,
  onHeroImageChange,
  tagsInput,
  onTagsInputChange,
  featured,
  onFeaturedChange,
  status,
  onStatusChange,
}: EventDetailsSectionProps) {
  const slugPreview = useMemo(() => slugifyArticleTitle(slug || title), [slug, title])

  return (
    <EventEditorSectionShell
      value="details"
      title="Event details"
      description="Core publishing fields, media, tags, and visibility."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="event-title">Title</Label>
          <Input
            id="event-title"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="Event title"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="event-slug">Slug</Label>
            <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onSlugUnlock}>
              Edit slug
            </Button>
          </div>
          <Input
            id="event-slug"
            value={slug}
            onChange={(event) => onSlugChange(event.target.value)}
            placeholder="event-slug"
          />
          <p className="text-xs text-muted-foreground">{slugPreview ? `Public URL: /events/${slugPreview}` : 'Slug will be generated from the title.'}</p>
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={onCategoryChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_CATEGORIES.map((entry) => (
                <SelectItem key={entry} value={entry}>
                  {entry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="event-organizer">Organizer</Label>
          <Input
            id="event-organizer"
            value={organizer}
            onChange={(event) => onOrganizerChange(event.target.value)}
            placeholder="Organizer"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="event-description">Description</Label>
          <Textarea
            id="event-description"
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="Describe the event agenda, speakers, and audience."
            rows={8}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <CollapsibleAssetField label="Hero image" value={heroImage} onChange={onHeroImageChange} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="event-tags">Tags (comma separated)</Label>
          <Input
            id="event-tags"
            value={tagsInput}
            onChange={(event) => onTagsInputChange(event.target.value)}
            placeholder="Global Justice, Awards, Africa"
          />
        </div>

        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <Label htmlFor="event-featured">Featured event</Label>
          <Switch id="event-featured" checked={featured} onCheckedChange={onFeaturedChange} />
        </div>

        <div className="space-y-2 rounded-md border border-border px-3 py-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(value) => onStatusChange(value as EventStatus)}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </EventEditorSectionShell>
  )
}
