'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Moon, Sun } from 'lucide-react';
import type { ThemeStatePayload } from 'tweakcn-ui';
import { ThemeControlPanel, useEditorStore } from 'tweakcn-ui/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { THEME_PRESETS } from '@/components/admin/theme/theme-presets';
import { normalizeThemePayloadToOklch, normalizeThemeStylesToOklch } from '@/lib/theme-normalize';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type PageOption = {
  slug: string;
  title?: string | null;
};

type ThemeEditorViewProps = {
  pages: PageOption[];
  selectedSlug: string;
  onPageChange?: (slug: string) => void;
  children: React.ReactNode;
};

type ThemeState = {
  styles: ThemeStatePayload['styles'];
  currentMode: ThemeStatePayload['currentMode'];
  hslAdjustments?: ThemeStatePayload['hslAdjustments'];
  preset?: ThemeStatePayload['preset'];
};

const TOKEN_MAP = [
  { key: 'background', token: '--vd-bg' },
  { key: 'foreground', token: '--vd-fg' },
  { key: 'card', token: '--vd-card' },
  { key: 'card-foreground', token: '--vd-card-fg' },
  { key: 'popover', token: '--vd-popover' },
  { key: 'popover-foreground', token: '--vd-popover-fg' },
  { key: 'primary', token: '--vd-primary' },
  { key: 'primary-foreground', token: '--vd-primary-fg' },
  { key: 'secondary', token: '--vd-secondary' },
  { key: 'secondary-foreground', token: '--vd-secondary-fg' },
  { key: 'muted', token: '--vd-muted' },
  { key: 'muted-foreground', token: '--vd-muted-fg' },
  { key: 'accent', token: '--vd-accent' },
  { key: 'accent-foreground', token: '--vd-accent-fg' },
  { key: 'border', token: '--vd-border' },
  { key: 'input', token: '--vd-input' },
  { key: 'ring', token: '--vd-ring' },
  { key: 'radius', token: '--vd-radius' },
  { key: 'font-sans', token: '--vd-font-sans' },
  { key: 'font-serif', token: '--vd-font-display' },
  { key: 'font-mono', token: '--vd-font-mono' }
];

async function requestJson(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    headers: {
      'content-type': 'application/json',
      ...(options?.headers ?? {})
    },
    ...options
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error || 'Request failed';
    throw new Error(message);
  }
  return payload;
}

function formatPageLabel(page: PageOption) {
  if (page.title) return page.title;
  if (page.slug === 'home') return 'Home';
  return page.slug.replace(/-/g, ' ');
}

function buildPayload(state: ThemeState): ThemeStatePayload {
  return {
    styles: state.styles,
    currentMode: state.currentMode,
    hslAdjustments: state.hslAdjustments,
    preset: state.preset
  };
}

function mergePresetStyles(
  current: ThemeStatePayload['styles'],
  preset: {
    light?: Partial<ThemeStatePayload['styles']['light']>;
    dark?: Partial<ThemeStatePayload['styles']['dark']>;
  }
): ThemeStatePayload['styles'] {
  const currentLight = current?.light ?? {};
  const currentDark = current?.dark ?? {};
  const presetLight = preset.light ?? {};
  const presetDark = preset.dark ?? {};
  return {
    light: { ...currentLight, ...presetLight },
    dark: { ...currentDark, ...presetLight, ...presetDark }
  };
}

export function ThemeEditorView({ pages, selectedSlug, onPageChange, children }: ThemeEditorViewProps) {
  const router = useRouter();
  const themeState = useEditorStore((state) => state.themeState);
  const setThemeState = useEditorStore((state) => state.setThemeState);
  const saveThemeCheckpoint = useEditorStore((state) => state.saveThemeCheckpoint);
  const hasUnsavedChanges = useEditorStore((state) => state.hasUnsavedChanges);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [importing, setImporting] = useState(false);
  const themePromise = useMemo(() => Promise.resolve(null), []);
  const [selectedPreset, setSelectedPreset] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);
  const helpId = useId();

  const pageOptions = useMemo(
    () => pages.filter((page) => page.slug).map((page) => ({ ...page, label: formatPageLabel(page) })),
    [pages]
  );

  const applyPayload = useCallback(
    (payload: ThemeStatePayload) => {
      const normalized = normalizeThemePayloadToOklch(payload);
      const prev = useEditorStore.getState().themeState;
      setThemeState({
        ...prev,
        styles: normalized?.styles ?? prev.styles,
        currentMode: normalized?.currentMode ?? prev.currentMode,
        hslAdjustments: normalized?.hslAdjustments ?? prev.hslAdjustments,
        preset: normalized?.preset ?? prev.preset
      });
      setSelectedPreset(typeof normalized?.preset === 'string' ? normalized.preset : '');
      queueMicrotask(() => saveThemeCheckpoint());
    },
    [saveThemeCheckpoint, setThemeState]
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    requestJson('/api/theme/draft')
      .then((payload) => {
        if (!active) return;
        if (payload?.payload) {
          applyPayload(payload.payload as ThemeStatePayload);
        }
      })
      .catch((error) => {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'Unable to load theme draft';
        toast.error(message);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [applyPayload]);

  useEffect(() => {
    const nextPreset = typeof themeState.preset === 'string' ? themeState.preset : '';
    if (nextPreset !== selectedPreset) {
      setSelectedPreset(nextPreset);
    }
  }, [selectedPreset, themeState.preset]);

  const handlePageChange = (value: string) => {
    if (onPageChange) {
      onPageChange(value);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    params.set('page', value);
    router.replace(`/admin/theme?${params.toString()}`);
  };

  const handlePresetChange = (value: string) => {
    const preset = THEME_PRESETS.find((item) => item.id === value);
    if (!preset) return;
    const prev = useEditorStore.getState().themeState;
    try {
      const merged = mergePresetStyles(themeState.styles, preset.styles);
      const nextStyles = normalizeThemeStylesToOklch(merged, { strict: true });
      setThemeState({ ...prev, styles: nextStyles, preset: preset.id });
      setSelectedPreset(preset.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to apply theme preset';
      toast.error(message);
    }
  };

  const handleModeToggle = () => {
    const prev = useEditorStore.getState().themeState;
    const nextMode = prev.currentMode === 'dark' ? 'light' : 'dark';
    setThemeState({ ...prev, currentMode: nextMode });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const rawPayload = buildPayload(themeState as ThemeState);
      const payload = normalizeThemePayloadToOklch(rawPayload, { strict: true }) as ThemeStatePayload;
      await requestJson('/api/theme/draft', {
        method: 'POST',
        body: JSON.stringify({ payload })
      });
      saveThemeCheckpoint();
      toast.success('Theme draft saved');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save theme draft';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const response = await requestJson('/api/theme/publish', { method: 'POST' });
      if (response?.payload) {
        applyPayload(response.payload as ThemeStatePayload);
      }
      toast.success('Theme published');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to publish theme';
      toast.error(message);
    } finally {
      setPublishing(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const response = await requestJson('/api/theme/reset', { method: 'POST' });
      if (response?.payload) {
        applyPayload(response.payload as ThemeStatePayload);
      }
      toast.success('Theme reset to default');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to reset theme';
      toast.error(message);
    } finally {
      setResetting(false);
    }
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setImporting(true);
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid theme file');
      }
      if (!parsed.styles || typeof parsed.styles !== 'object') {
        throw new Error('Theme file is missing styles');
      }
      const normalized = normalizeThemePayloadToOklch(parsed as ThemeStatePayload, { strict: true });
      applyPayload(normalized as ThemeStatePayload);
      toast.success('Theme imported. Save draft to keep changes.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to import theme';
      toast.error(message);
    } finally {
      setImporting(false);
    }
  };

  const dirty = !loading && hasUnsavedChanges();
  const modeLabel = themeState.currentMode === 'dark' ? 'Dark' : 'Light';

  return (
    <div className="flex min-h-screen flex-col bg-[var(--vd-bg)] text-[var(--vd-fg)]">
      <header className="border-b border-[var(--vd-border)] bg-[var(--vd-bg)]">
        <div className="flex flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold">Theme Editor</h1>
              <Badge className="text-[10px] uppercase tracking-widest">OKLCH only</Badge>
            </div>
            <p className="text-xs text-[var(--vd-muted-fg)]">
              Changes apply instantly across the previewed page.
              {dirty ? ' Unsaved changes.' : ' All changes saved.'}
            </p>
            <p id={helpId} className="text-[11px] text-[var(--vd-muted-fg)]">
              Colors are stored as OKLCH tokens. Non-OKLCH values are normalized on save.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="grid gap-1">
                <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--vd-muted-fg)]">
                  Preview page
                </span>
                <Select value={selectedSlug} onValueChange={handlePageChange}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SelectTrigger className="h-9 w-[220px]">
                        <SelectValue placeholder="Select page" />
                      </SelectTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Choose the page the theme preview renders.</TooltipContent>
                  </Tooltip>
                  <SelectContent>
                    {pageOptions.map((page) => (
                      <SelectItem key={page.slug} value={page.slug}>
                        {page.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--vd-muted-fg)]">
                  Theme preset
                </span>
                <Select value={selectedPreset} onValueChange={handlePresetChange}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SelectTrigger className="h-9 w-[200px]">
                        <SelectValue placeholder="Theme preset" />
                      </SelectTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Apply an OKLCH preset across all tokens.</TooltipContent>
                  </Tooltip>
                  <SelectContent>
                    {THEME_PRESETS.map((preset) => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Button variant="outline" size="sm" onClick={handleModeToggle}>
                      {themeState.currentMode === 'dark' ? (
                        <Sun className="mr-2 h-4 w-4" />
                      ) : (
                        <Moon className="mr-2 h-4 w-4" />
                      )}
                      {modeLabel} mode
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Toggle the preview between light and dark.</TooltipContent>
              </Tooltip>
            </div>
            <div className="hidden h-8 w-px bg-[var(--vd-border)] lg:block" />
            <div className="flex flex-wrap items-center gap-2">
              <div className="grid gap-1">
                <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--vd-muted-fg)]">
                  Actions
                </span>
              </div>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={handleImport}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleImportClick}
                      disabled={importing || saving || publishing || resetting}
                    >
                      {importing ? 'Importing…' : 'Import theme'}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Import a JSON theme (OKLCH values only).</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Button size="sm" variant="outline" onClick={handleSave} disabled={saving || publishing || resetting}>
                      {saving ? 'Saving…' : 'Save draft'}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Save a draft without publishing.</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Button size="sm" onClick={handlePublish} disabled={publishing || resetting}>
                      {publishing ? 'Publishing…' : 'Publish'}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Publish the current theme to the live site.</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Button size="sm" variant="ghost" onClick={handleReset} disabled={resetting || publishing || saving}>
                      {resetting ? 'Resetting…' : 'Reset default'}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Reset back to the default theme.</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="flex h-[48vh] min-h-0 flex-col border-b border-[var(--vd-border)] lg:h-auto lg:w-[380px] lg:border-b-0 lg:border-r">
          <div className="flex-1 overflow-y-auto">
            <details className="border-b border-[var(--vd-border)] p-4 text-xs text-[var(--vd-muted-fg)]">
              <summary className="cursor-pointer font-medium text-[var(--vd-fg)]">
                App token mapping
              </summary>
              <p className="mt-2">
                Theme controls map to the app tokens below. Use these names when styling blocks.
              </p>
              <div className="mt-3 grid gap-1">
                {TOKEN_MAP.map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-3">
                    <span className="font-mono">{item.key}</span>
                    <span className="font-mono text-[var(--vd-fg)]">{item.token}</span>
                  </div>
                ))}
              </div>
            </details>
            <ThemeControlPanel
              styles={themeState.styles}
              currentMode={themeState.currentMode}
              onChange={(styles) => {
                const prev = useEditorStore.getState().themeState;
                const normalized = normalizeThemeStylesToOklch(styles);
                setThemeState({ ...prev, styles: normalized });
              }}
              themePromise={themePromise}
              saveLoadButtons={null}
            />
          </div>
        </aside>
        <section className="min-h-0 flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">{children}</div>
        </section>
      </div>
    </div>
  );
}
