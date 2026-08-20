'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export const DEFAULT_BRAND_COLOR = '#3367d6';

export const HEADING_FONT_OPTIONS = [
  { label: 'PT Serif', value: 'var(--font-pt-serif), "PT Serif", Georgia, serif' },
  { label: 'Merriweather', value: '"Merriweather", Georgia, serif' },
  { label: 'Source Serif Pro', value: '"Source Serif Pro", "Source Serif 4", Georgia, serif' },
  { label: 'Playfair Display', value: '"Playfair Display", Georgia, serif' },
  { label: 'Libre Baskerville', value: '"Libre Baskerville", Georgia, serif' },
  { label: 'System Serif', value: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' },
];

export const BODY_FONT_OPTIONS = [
  { label: 'PT Sans', value: 'var(--font-pt-sans), "PT Sans", ui-sans-serif, system-ui, sans-serif' },
  { label: 'Source Sans 3', value: '"Source Sans 3", ui-sans-serif, system-ui, sans-serif' },
  { label: 'Nunito Sans', value: '"Nunito Sans", ui-sans-serif, system-ui, sans-serif' },
  { label: 'Work Sans', value: '"Work Sans", ui-sans-serif, system-ui, sans-serif' }
];

function normalizeHexColor(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const shortMatch = /^#([0-9a-f]{3})$/i.exec(trimmed);
  if (shortMatch) {
    const [r, g, b] = shortMatch[1].split('');
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  const fullMatch = /^#([0-9a-f]{6})$/i.exec(trimmed);
  if (fullMatch) return `#${fullMatch[1].toLowerCase()}`;
  return null;
}

function rgbToHex(value: string): string | null {
  const match = value.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (!match) return null;
  const [r, g, b] = match.slice(1, 4).map((channel) => Number(channel));
  if ([r, g, b].some((channel) => Number.isNaN(channel))) return null;
  return `#${[r, g, b]
    .map((channel) => Math.max(0, Math.min(255, channel)).toString(16).padStart(2, '0'))
    .join('')}`;
}

export function normalizeBrandHexColor(value: string) {
  return normalizeHexColor(value) || DEFAULT_BRAND_COLOR;
}

export function colorToHex(value: string | undefined): string {
  const fromHex = normalizeHexColor(value || '');
  if (fromHex) return fromHex;
  if (typeof document === 'undefined') return DEFAULT_BRAND_COLOR;
  const probe = document.createElement('span');
  probe.style.color = '';
  probe.style.color = value || '';
  if (!probe.style.color) return DEFAULT_BRAND_COLOR;
  document.body.appendChild(probe);
  const computed = window.getComputedStyle(probe).color;
  document.body.removeChild(probe);
  return rgbToHex(computed) || DEFAULT_BRAND_COLOR;
}

type ThemeBrandSettingsPanelProps = {
  brandColor: string;
  headingFontValue: string;
  bodyFontValue: string;
  modeLabel: string;
  currentMode: 'light' | 'dark';
  showAdvancedTheming: boolean;
  onBrandColorChange: (value: string) => void;
  onHeadingFontChange: (value: string) => void;
  onBodyFontChange: (value: string) => void;
  onToggleMode: () => void;
  onToggleAdvanced: () => void;
};

export function ThemeBrandSettingsPanel({
  brandColor,
  headingFontValue,
  bodyFontValue,
  modeLabel,
  currentMode,
  showAdvancedTheming,
  onBrandColorChange,
  onHeadingFontChange,
  onBodyFontChange,
  onToggleMode,
  onToggleAdvanced
}: ThemeBrandSettingsPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Brand Settings</CardTitle>
        <p className="text-xs text-[var(--vd-muted-fg)]">
          Use these quick controls for day-to-day brand updates.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--vd-muted-fg)]">
            Brand color
          </span>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={brandColor}
              onChange={(event) => onBrandColorChange(event.target.value)}
              className="h-9 w-12 cursor-pointer rounded border border-[var(--vd-border)] bg-[var(--vd-bg)]"
              aria-label="Brand color"
            />
            <code className="rounded bg-[var(--vd-muted)] px-2 py-1 text-xs text-[var(--vd-fg)]">
              {brandColor}
            </code>
          </div>
        </div>
        <div className="grid gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--vd-muted-fg)]">
            Heading font
          </span>
          <Select value={headingFontValue} onValueChange={onHeadingFontChange}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Choose heading font" />
            </SelectTrigger>
            <SelectContent>
              {HEADING_FONT_OPTIONS.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--vd-muted-fg)]">
            Body font
          </span>
          <Select value={bodyFontValue} onValueChange={onBodyFontChange}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Choose body font" />
            </SelectTrigger>
            <SelectContent>
              {BODY_FONT_OPTIONS.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onToggleMode}>
            {currentMode === 'dark' ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            {modeLabel} mode
          </Button>
          <Button variant="ghost" size="sm" onClick={onToggleAdvanced}>
            {showAdvancedTheming ? 'Hide advanced theming' : 'Advanced theming'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
