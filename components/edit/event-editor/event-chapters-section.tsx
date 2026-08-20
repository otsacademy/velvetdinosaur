'use client'

import { EventEditorSectionShell } from '@/components/edit/event-editor/event-editor-section-shell'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ASAP_CHAPTER_OPTIONS } from '@/lib/chapters'

type EventChaptersSectionProps = {
  primaryChapterSlug: string
  onPrimaryChapterChange: (value: string) => void
  chapterSlugs: string[]
  onChapterToggle: (slug: string, checked: boolean) => void
}

export function EventChaptersSection({
  primaryChapterSlug,
  onPrimaryChapterChange,
  chapterSlugs,
  onChapterToggle,
}: EventChaptersSectionProps) {
  return (
    <EventEditorSectionShell
      value="chapters"
      title="Chapter affiliations"
      description="Set the primary chapter and any additional affiliations."
    >
      <div className="grid gap-5">
        <div className="space-y-2">
          <Label>Primary chapter</Label>
          <Select value={primaryChapterSlug || '__none__'} onValueChange={(value) => onPrimaryChapterChange(value === '__none__' ? '' : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a chapter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">No primary chapter yet</SelectItem>
              {ASAP_CHAPTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Default from the signed-in profile, but editable per event.</p>
        </div>

        <div className="space-y-2">
          <Label>Additional chapter affiliations</Label>
          <div className="grid gap-2 md:grid-cols-2">
            {ASAP_CHAPTER_OPTIONS.map((option) => {
              const checked = primaryChapterSlug === option.value || chapterSlugs.includes(option.value)
              const isPrimary = primaryChapterSlug === option.value
              return (
                <label
                  key={option.value}
                  className="flex items-start gap-3 rounded-md border border-border/50 bg-background/80 px-3 py-2"
                >
                  <Checkbox
                    checked={checked}
                    disabled={isPrimary}
                    onCheckedChange={(value) => onChapterToggle(option.value, value === true)}
                    className="mt-0.5"
                  />
                  <span className="space-y-0.5">
                    <span className="block text-sm font-medium text-foreground">{option.label}</span>
                    <span className="block text-xs text-muted-foreground">
                      {isPrimary ? 'Primary chapter' : 'Show the event under more than one chapter when relevant.'}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      </div>
    </EventEditorSectionShell>
  )
}
