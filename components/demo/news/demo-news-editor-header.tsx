'use client';

import Image from 'next/image';
import {
  ChevronDown,
  Clock3,
  Download,
  Eye,
  Loader2,
  RotateCcw,
  Save,
  Send,
  Upload,
} from 'lucide-react';
import { DemoOnboardingControls } from '@/components/demo/onboarding/demo-onboarding-controls.client';
import { DemoHelpTooltip } from '@/components/demo/demo-help-tooltip';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type SaveStateMeta = {
  label: string;
  toneClass: string;
};

type DemoNewsEditorHeaderProps = {
  title: string;
  subtitle: string;
  returnHref: string;
  mainSiteHref: string;
  saveStateMeta: SaveStateMeta;
  isSubmitting: boolean;
  mediaBusy: boolean;
  isImportingDocument: boolean;
  isExportingDocument: boolean;
  showSettings: boolean;
  editorFullWidth: boolean;
  editorSmallText: boolean;
  editorLockPage: boolean;
  isDirty: boolean;
  onPreview: () => void;
  onSaveChanges: () => void;
  onSaveDraft: () => void;
  onPublishNow: () => void;
  onSchedule: () => void;
  onOpenHistory: () => void;
  onImport: () => void;
  onExport: (format: 'docx' | 'pdf' | 'md' | 'html') => void;
  onToggleSettings: (checked: boolean) => void;
  onToggleFullWidth: (checked: boolean) => void;
  onToggleSmallText: (checked: boolean) => void;
  onToggleLockPage: (checked: boolean) => void;
  onFontFamilyChange: (value: 'sans' | 'serif' | 'mono') => void;
  onResetDraftEdits: () => void;
  editorFontFamily: 'sans' | 'serif' | 'mono';
};

export function DemoNewsEditorHeader({
  title,
  subtitle,
  returnHref,
  mainSiteHref,
  saveStateMeta,
  isSubmitting,
  mediaBusy,
  isImportingDocument,
  isExportingDocument,
  showSettings,
  editorFullWidth,
  editorSmallText,
  editorLockPage,
  isDirty,
  onPreview,
  onSaveChanges,
  onSaveDraft,
  onPublishNow,
  onSchedule,
  onOpenHistory,
  onImport,
  onExport,
  onToggleSettings,
  onToggleFullWidth,
  onToggleSmallText,
  onToggleLockPage,
  onFontFamilyChange,
  onResetDraftEdits,
  editorFontFamily,
}: DemoNewsEditorHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="w-full px-3 py-2 lg:px-6 xl:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-1">
            <a href={returnHref} className="inline-flex h-8 items-center text-sm text-muted-foreground hover:text-foreground">
              Back to site
            </a>
            <p className="text-[12px] text-muted-foreground">{subtitle}</p>
            <p className="max-w-[80ch] break-words text-sm font-medium leading-snug text-foreground">
              {title.trim() || 'Untitled article'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <DemoOnboardingControls pageKey="news" />
            <DemoHelpTooltip content="Open a reader-friendly preview of the article so you can check the layout before the demo publish step.">
              <Button variant="outline" size="sm" onClick={onPreview} disabled={isSubmitting || mediaBusy}>
                <Eye className="h-4 w-4" />
                Preview
              </Button>
            </DemoHelpTooltip>
            <a
              href={mainSiteHref}
              aria-label="Back to Velvet Dinosaur home page"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--vd-border)] bg-background hover:bg-muted"
            >
              <Image
                src="/logo.webp"
                alt="Velvet Dinosaur"
                width={28}
                height={28}
                className="h-7 w-7 rounded-full object-contain"
              />
            </a>
            <DemoHelpTooltip content="Save the current article draft inside this sandbox. The content updates locally for this session only.">
              <Button onClick={onSaveChanges} disabled={isSubmitting || mediaBusy || editorLockPage}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save changes
              </Button>
            </DemoHelpTooltip>

            <DropdownMenu>
              <DemoHelpTooltip content="Open the secondary article actions, including publish, schedule, import, export, and editor settings.">
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting || mediaBusy || isImportingDocument || isExportingDocument}
                  >
                    More
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </DemoHelpTooltip>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={onSaveDraft} disabled={editorLockPage}>
                  <Save className="h-4 w-4" />
                  Save draft
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onPublishNow} disabled={editorLockPage}>
                  <Send className="h-4 w-4" />
                  Publish article
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onSchedule} disabled={editorLockPage}>
                  <Clock3 className="h-4 w-4" />
                  Schedule publication
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onPreview} disabled={editorLockPage}>
                  <Eye className="h-4 w-4" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onOpenHistory}>
                  <Clock3 className="h-4 w-4" />
                  Version history
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    onImport();
                  }}
                  disabled={editorLockPage || isImportingDocument || isSubmitting || mediaBusy}
                >
                  <Upload className="h-4 w-4" />
                  {isImportingDocument ? 'Importing…' : 'Import'}
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Download className="h-4 w-4" />
                    Export
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-44">
                    <DropdownMenuItem onSelect={() => onExport('docx')} disabled={isExportingDocument}>
                      Word (.docx)
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onExport('pdf')} disabled={isExportingDocument}>
                      PDF (.pdf)
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onExport('md')} disabled={isExportingDocument}>
                      Markdown (.md)
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onExport('html')} disabled={isExportingDocument}>
                      HTML (.html)
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={showSettings}
                  onCheckedChange={(checked) => onToggleSettings(Boolean(checked))}
                >
                  Show settings panel
                </DropdownMenuCheckboxItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Editor settings</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-56">
                    <DropdownMenuCheckboxItem
                      checked={editorFullWidth}
                      onCheckedChange={(checked) => onToggleFullWidth(Boolean(checked))}
                    >
                      Full width
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={editorSmallText}
                      onCheckedChange={(checked) => onToggleSmallText(Boolean(checked))}
                    >
                      Small text
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={editorLockPage}
                      onCheckedChange={(checked) => onToggleLockPage(Boolean(checked))}
                    >
                      Lock page
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Font family</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-48">
                        <DropdownMenuRadioGroup value={editorFontFamily} onValueChange={(value) => onFontFamilyChange(value as 'sans' | 'serif' | 'mono')}>
                          <DropdownMenuRadioItem value="sans">Sans (Inter)</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="serif">Serif</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="mono">Mono</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onResetDraftEdits} disabled={!isDirty || editorLockPage}>
                  <RotateCcw className="h-4 w-4" />
                  Reset edits
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <p className={`w-full text-right text-[11px] md:w-auto md:text-left ${saveStateMeta.toneClass}`}>
              {saveStateMeta.label}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
