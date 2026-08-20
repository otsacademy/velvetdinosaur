'use client';

import { ASAP_CHAPTER_OPTIONS } from '@/lib/chapters';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PRIMARY_CHAPTER_NONE = '__none__';

type PageEditorChapterSectionProps = {
  primaryChapterSlug: string;
  chapterSlugs: string[];
  onPrimaryChapterChange: (value: string) => void;
  onChapterToggle: (slug: string, checked: boolean) => void;
};

export function PageEditorChapterSection({
  primaryChapterSlug,
  chapterSlugs,
  onPrimaryChapterChange,
  onChapterToggle
}: PageEditorChapterSectionProps) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-[var(--vd-border)] bg-[var(--vd-card)]/90 p-4 shadow-sm">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-[var(--vd-fg)]">Page ownership</h2>
        <p className="text-xs text-[var(--vd-muted-fg)]">
          Internal chapter ownership defaults from your profile, but you can override it per page.
        </p>
      </div>

      <div className="mt-4 grid min-w-0 gap-4">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="page-primary-chapter">Primary chapter</Label>
          <Select
            value={primaryChapterSlug || PRIMARY_CHAPTER_NONE}
            onValueChange={(value) => onPrimaryChapterChange(value === PRIMARY_CHAPTER_NONE ? '' : value)}
          >
            <SelectTrigger id="page-primary-chapter">
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
        </div>

        <div className="min-w-0 space-y-2">
          <Label>Additional chapter affiliations</Label>
          <div className="grid min-w-0 gap-2">
            {ASAP_CHAPTER_OPTIONS.map((option) => {
              const checked = primaryChapterSlug === option.value || chapterSlugs.includes(option.value);
              const isPrimary = primaryChapterSlug === option.value;

              return (
                <label
                  key={option.value}
                  className="flex min-w-0 items-start gap-3 rounded-md border border-[var(--vd-border)] bg-[var(--vd-bg)] px-3 py-2"
                >
                  <Checkbox
                    checked={checked}
                    disabled={isPrimary}
                    onCheckedChange={(value) => onChapterToggle(option.value, value === true)}
                    className="mt-0.5"
                  />
                  <span className="min-w-0 space-y-0.5">
                    <span className="block text-sm font-medium text-[var(--vd-fg)]">{option.label}</span>
                    <span className="block text-xs text-[var(--vd-muted-fg)]">
                      {isPrimary ? 'Primary chapter' : 'Use this when the page belongs to more than one chapter.'}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
