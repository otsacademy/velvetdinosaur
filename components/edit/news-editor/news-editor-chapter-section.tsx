'use client'

import { ASAP_CHAPTER_OPTIONS } from '@/lib/chapters'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const PRIMARY_CHAPTER_NONE = '__none__'

type NewsEditorChapterSectionProps = {
  primaryChapterSlug: string
  chapterSlugs: string[]
  onPrimaryChapterChange: (value: string) => void
  onChapterToggle: (slug: string, checked: boolean) => void
}

export function NewsEditorChapterSection({
  primaryChapterSlug,
  chapterSlugs,
  onPrimaryChapterChange,
  onChapterToggle,
}: NewsEditorChapterSectionProps) {
  return (
    <div className="space-y-4 rounded-lg border border-border/60 bg-muted/15 p-3">
      <div className="space-y-1">
        <Label htmlFor="news-primary-chapter">Primary chapter</Label>
        <Select
          value={primaryChapterSlug || PRIMARY_CHAPTER_NONE}
          onValueChange={(value) => onPrimaryChapterChange(value === PRIMARY_CHAPTER_NONE ? '' : value)}
        >
          <SelectTrigger id="news-primary-chapter">
            <SelectValue placeholder="Select a chapter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={PRIMARY_CHAPTER_NONE}>No primary chapter yet</SelectItem>
            {ASAP_CHAPTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          New articles default to the author profile chapter, but you can override that per article here.
        </p>
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
                    {isPrimary ? 'Primary chapter' : 'Show this article under more than one chapter when relevant.'}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}
