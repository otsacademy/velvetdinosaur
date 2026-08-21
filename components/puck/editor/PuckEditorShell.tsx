'use client';

import * as React from 'react';
import { PUCK_PATTERNS } from '@/lib/puck/patterns';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  LayoutGrid,
  ListTree,
  Lock,
  LockOpen,
  Palette,
  Send,
  Settings,
  SlidersHorizontal
} from 'lucide-react';
import { SessionControls } from '@/components/auth/session-controls.client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { MenuDock, MenuDockItem } from '@/components/ui/menu-dock';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PatternLibrary } from '@/components/puck/editor/pattern-library.client';
import { EditorGettingStarted } from '@/components/puck/editor/editor-getting-started';
import { createUsePuck, Puck } from '@puckeditor/core';
import {
  getSelectedKey,
  PinIcon,
  PinOffIcon,
  PropertiesPanel
} from '@/components/puck/editor/puck-editor-shell-utils';

type EditorPanel = 'components' | 'outline' | 'properties' | 'settings' | 'theme' | null;
type PatternPayloadLike = (typeof PUCK_PATTERNS)[number];

const usePuckStore = createUsePuck();

export type PuckEditorShellProps = {
  children: React.ReactNode;
  title: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  statusLabel?: string;
  onPublish: () => void;
  onSaveDraft: () => void;
  onResetDraft?: () => void;
  onOpenTheme?: () => void;
  themePanel?: React.ReactNode;
  settingsPanel?: React.ReactNode;
  onClose: () => void;
  /** Optional site extras rendered at the end of the header action row. */
  headerExtra?: React.ReactNode;
  closeLabel?: string;
  saveDisabled?: boolean;
  publishDisabled?: boolean;
  publishLabel?: string;
  publishingLabel?: string;
  resetDisabled?: boolean;
  isSaving?: boolean;
  isPublishing?: boolean;
  isGlobal?: boolean;
  isGlobalEditingLocked?: boolean;
  onUnlockGlobal?: () => void;
  onLockGlobal?: () => void;
  legacyTemplateTypes?: string[];
  onConvertLegacyTemplate?: () => void;
  isConvertingLegacyTemplate?: boolean;
  onInsertPattern: (pattern: PatternPayloadLike) => void;
};

export function PuckEditorShell({
  children,
  title,
  breadcrumbs,
  statusLabel,
  onPublish,
  onSaveDraft,
  onResetDraft,
  onOpenTheme,
  themePanel,
  settingsPanel,
  onClose,
  headerExtra,
  closeLabel = 'Back to dashboard',
  saveDisabled,
  publishDisabled,
  publishLabel,
  publishingLabel,
  resetDisabled,
  isSaving,
  isPublishing,
  isGlobal,
  isGlobalEditingLocked,
  onUnlockGlobal,
  onLockGlobal,
  legacyTemplateTypes,
  onConvertLegacyTemplate,
  isConvertingLegacyTemplate,
  onInsertPattern
}: PuckEditorShellProps) {
  const selectedItem = usePuckStore((state) => state.selectedItem);
  const [activePanel, setActivePanel] = React.useState<EditorPanel>(null);
  const [leftPinned, setLeftPinned] = React.useState(false);
  const [propertiesPinned, setPropertiesPinned] = React.useState(false);
  const [leftPanelTab, setLeftPanelTab] = React.useState<'components' | 'outline'>('components');
  const [isUnlockDialogOpen, setIsUnlockDialogOpen] = React.useState(false);

  const selectedKey = React.useMemo(() => {
    const key = getSelectedKey(selectedItem);
    if (!selectedItem) return null;
    if (key) return key;
    try {
      return JSON.stringify(selectedItem);
    } catch {
      return '__selected__';
    }
  }, [selectedItem]);
  const lastSelectedKeyRef = React.useRef<string | null>(null);
  const leftPanelOpen = leftPinned || activePanel === 'components' || activePanel === 'outline';
  const leftPanelValue =
    activePanel === 'outline'
      ? 'outline'
      : activePanel === 'components'
        ? 'components'
        : leftPanelTab;
  const propertiesOpen = propertiesPinned || activePanel === 'properties';
  const hasThemePanel = Boolean(themePanel);
  const hasSettingsPanel = Boolean(settingsPanel);
  const isGlobalRouteLocked = Boolean(isGlobal && isGlobalEditingLocked);
  const isGlobalHeader = Boolean(isGlobal && title.toLowerCase().includes('header'));
  const unlockLabel = isGlobalHeader ? 'Edit navigation' : 'Unlock global editing';
  const lockLabel = isGlobalHeader ? 'Lock global editing' : 'Lock global editing';
  const globalLockedHeading = isGlobalHeader ? 'Navigation editing is locked.' : 'Global content is locked.';
  const globalLockedDescription = isGlobalHeader
    ? "This navigation appears on every page. Click 'Edit navigation' to make changes."
    : 'This is global content. Changes apply to all pages.';
  const showHeaderDraftCallout = Boolean(
    isGlobalHeader && statusLabel && statusLabel.toLowerCase() === 'draft only'
  );
  const hasLegacyTemplateCallout = Boolean(!isGlobal && (legacyTemplateTypes?.length || 0) > 0);
  const legacyTemplateSummary = (legacyTemplateTypes || []).join(', ');
  const showLegacyConvertButton = hasLegacyTemplateCallout && typeof onConvertLegacyTemplate === 'function';
  const calloutCount = Number(showHeaderDraftCallout) + Number(hasLegacyTemplateCallout);
  const contentTopPaddingClass = calloutCount === 0 ? 'pt-14' : calloutCount === 1 ? 'pt-24' : 'pt-32';
  const sheetPositionClass =
    calloutCount === 0
      ? 'top-14 h-[calc(100dvh-3.5rem)]'
      : calloutCount === 1
        ? 'top-22 h-[calc(100dvh-5.5rem)]'
        : 'top-30 h-[calc(100dvh-7.5rem)]';
  const rightPanelSheetClass =
    `${sheetPositionClass} w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] gap-0 overflow-hidden p-0 sm:w-[28rem] sm:max-w-md`;

  const leftPinLabel = leftPinned ? 'Unpin components panel' : 'Pin components panel';
  const propertiesPinLabel = propertiesPinned
    ? 'Unpin properties panel'
    : 'Pin properties panel';

  const handlePanelToggle = (panel: Exclude<EditorPanel, null>) => {
    if (panel === 'components' || panel === 'outline') {
      setLeftPanelTab(panel);
    }
    setActivePanel((current) => (current === panel ? null : panel));
  };

  const handleInsertPattern = React.useCallback(
    (pattern: PatternPayloadLike) => {
      if (isGlobalRouteLocked) return;
      onInsertPattern(pattern);
    },
    [isGlobalRouteLocked, onInsertPattern]
  );

  React.useEffect(() => {
    if (!selectedKey) {
      lastSelectedKeyRef.current = null;
      return;
    }
    if (selectedKey === lastSelectedKeyRef.current) return;
    lastSelectedKeyRef.current = selectedKey;
    if (propertiesPinned) return;
    if (activePanel === 'settings' || activePanel === 'theme') return;
    setActivePanel('properties');
  }, [selectedKey, propertiesPinned, activePanel]);

  const saveLabel = isSaving ? 'Saving...' : 'Save';
  const publishButtonLabel = isPublishing
    ? publishingLabel || 'Publishing...'
    : publishLabel || 'Publish';

  return (
    <div className="relative min-h-screen bg-[var(--vd-bg)]">
      <div className="fixed inset-x-0 top-0 z-40 border-b border-[var(--vd-border)] bg-[var(--vd-bg)] backdrop-blur">
        <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0">
              {breadcrumbs?.length ? (
                <Breadcrumb className="mb-0.5 hidden md:block">
                  <BreadcrumbList className="text-[11px] text-[var(--vd-muted-fg)]">
                    {breadcrumbs.map((item, index) => {
                      const isLast = index === breadcrumbs.length - 1;
                      return (
                        <React.Fragment key={`${item.label}-${index}`}>
                          <BreadcrumbItem>
                            {isLast || !item.href ? (
                              <BreadcrumbPage>{item.label}</BreadcrumbPage>
                            ) : (
                              <BreadcrumbLink asChild>
                                <Link href={item.href}>{item.label}</Link>
                              </BreadcrumbLink>
                            )}
                          </BreadcrumbItem>
                          {!isLast ? (
                            <BreadcrumbSeparator>
                              <ChevronRight className="h-3 w-3" />
                            </BreadcrumbSeparator>
                          ) : null}
                        </React.Fragment>
                      );
                    })}
                  </BreadcrumbList>
                </Breadcrumb>
              ) : null}
              <span className="truncate text-sm font-semibold text-[var(--vd-fg)]">{title}</span>
            </div>
            {isGlobal ? (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-[var(--vd-border)] bg-[var(--vd-muted)] px-2 py-0.5 text-[11px] text-[var(--vd-muted-fg)]"
              >
                {isGlobalRouteLocked ? <Lock className="h-3 w-3" /> : <LockOpen className="h-3 w-3" />}
                Global
              </span>
            ) : null}
            {statusLabel ? (
              <span className="rounded-full bg-[var(--vd-muted)] px-2 py-0.5 text-[11px] text-[var(--vd-muted-fg)]">
                {statusLabel}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isGlobal ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (isGlobalRouteLocked) {
                    setIsUnlockDialogOpen(true);
                  } else {
                    onLockGlobal?.();
                  }
                }}
              >
                {isGlobalRouteLocked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
                <span className="ml-2">
                  {isGlobalRouteLocked ? unlockLabel : lockLabel}
                </span>
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={onSaveDraft}
              disabled={saveDisabled || isPublishing || isSaving}
            >
              {saveLabel}
            </Button>
            {onResetDraft ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onResetDraft}
                disabled={resetDisabled || isPublishing || isSaving}
              >
                Reset draft
              </Button>
            ) : null}
            <Button size="sm" onClick={onPublish} disabled={publishDisabled || isPublishing}>
              {publishButtonLabel}
            </Button>
            <EditorGettingStarted />
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="h-4 w-4" />
              {closeLabel}
            </Button>
            {headerExtra}
            <SessionControls variant="inline" showAccountLink={false} className="hidden lg:flex" />
          </div>
        </div>
        {showHeaderDraftCallout ? (
          <div className="border-t border-[var(--vd-border)] bg-[var(--vd-muted)]/70">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6">
              <p className="text-xs text-[var(--vd-muted-fg)]">
                Header changes are draft-only right now. Publish to make navigation updates live.
              </p>
              <Button
                size="sm"
                onClick={onPublish}
                disabled={publishDisabled || isPublishing}
              >
                {isPublishing ? 'Publishing...' : 'Publish navigation'}
              </Button>
            </div>
          </div>
        ) : null}
        {hasLegacyTemplateCallout ? (
          <div className="border-t border-[var(--vd-border)] bg-[var(--vd-muted)]/70">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6">
              <p className="inline-flex items-center gap-2 text-xs text-[var(--vd-muted-fg)]">
                <AlertTriangle className="h-3.5 w-3.5 text-[var(--vd-fg)]" />
                Legacy page template detected ({legacyTemplateSummary}). Convert to blocks to unlock section editing.
              </p>
              {showLegacyConvertButton ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onConvertLegacyTemplate}
                  disabled={Boolean(isConvertingLegacyTemplate) || isSaving || isPublishing}
                >
                  {isConvertingLegacyTemplate ? 'Converting...' : 'Convert to blocks'}
                </Button>
              ) : (
                <span className="text-xs text-[var(--vd-muted-fg)]">No conversion template is available yet.</span>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className={`relative pb-24 ${contentTopPaddingClass}`}>
        <div
          className={`relative overflow-x-hidden overflow-y-auto ${
            isGlobal ? 'ring-1 ring-[var(--vd-border)] ring-offset-2 ring-offset-[var(--vd-bg)]' : ''
          }`}
        >
          {children}
          {isGlobalRouteLocked ? (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-[var(--vd-bg)]/70 p-6 text-center">
              <div className="max-w-sm rounded-lg border border-[var(--vd-border)] bg-[var(--vd-muted)] p-5 shadow-sm">
                <div className="text-sm font-semibold text-[var(--vd-fg)]">{globalLockedHeading}</div>
                <p className="mt-2 text-sm text-[var(--vd-muted-fg)]">
                  {globalLockedDescription}
                </p>
                <div className="mt-4">
                  <Button size="sm" onClick={() => setIsUnlockDialogOpen(true)}>
                    {unlockLabel}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
          {isGlobal ? (
            <div className="pointer-events-none absolute left-3 top-3 z-20 rounded-full border border-[var(--vd-border)] bg-[var(--vd-bg)] px-3 py-1 text-[11px] text-[var(--vd-muted-fg)]">
              <Badge variant="outline" className="h-auto border-0 px-0 py-0">
                <Lock className="mr-1 h-3 w-3" />
                Global
              </Badge>
            </div>
          ) : null}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
        <MenuDock
          variant="default"
          orientation="horizontal"
          showLabels
          animated
          aria-label="Editor navigation"
        >
          <MenuDockItem
            icon={<LayoutGrid className="h-5 w-5" />}
            label="Components"
            active={activePanel === 'components' || (leftPinned && leftPanelTab === 'components')}
            onClick={() => handlePanelToggle('components')}
          />
          <MenuDockItem
            icon={<ListTree className="h-5 w-5" />}
            label="Outline"
            active={activePanel === 'outline' || (leftPinned && leftPanelTab === 'outline')}
            onClick={() => handlePanelToggle('outline')}
          />
          <MenuDockItem
            icon={<SlidersHorizontal className="h-5 w-5" />}
            label="Properties"
            active={activePanel === 'properties' || propertiesPinned}
            onClick={() => handlePanelToggle('properties')}
          />
          <MenuDockItem
            icon={<Settings className="h-5 w-5" />}
            label="Settings"
            active={activePanel === 'settings'}
            onClick={() => handlePanelToggle('settings')}
            disabled={!hasSettingsPanel}
          />
          <MenuDockItem
            icon={<Palette className="h-5 w-5" />}
            label="Theme"
            active={activePanel === 'theme'}
            onClick={() => {
              if (hasThemePanel) {
                handlePanelToggle('theme');
              } else {
                onOpenTheme?.();
              }
            }}
            disabled={!hasThemePanel && !onOpenTheme}
          />
          <MenuDockItem
            icon={<Send className="h-5 w-5" />}
            label="Publish"
            onClick={onPublish}
            disabled={publishDisabled || isPublishing}
          />
        </MenuDock>
      </div>

      <Sheet
        open={leftPanelOpen}
        modal={false}
        onOpenChange={(open) => {
          if (!open) {
            setActivePanel(null);
            if (leftPinned) setLeftPinned(false);
          }
        }}
      >
        <SheetContent
          side="left"
          className={`${sheetPositionClass} gap-0 p-0 sm:max-w-sm`}
          overlay={false}
          onInteractOutside={(event) => {
            if (leftPinned) event.preventDefault();
          }}
          onEscapeKeyDown={(event) => {
            if (leftPinned) event.preventDefault();
          }}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Components</SheetTitle>
            <SheetDescription>Browse components and outline items for this page.</SheetDescription>
          </SheetHeader>
          <Tabs
            value={leftPanelValue}
            onValueChange={(value) => {
              setLeftPanelTab(value as 'components' | 'outline');
              setActivePanel(value as EditorPanel);
            }}
            className="flex h-full flex-col"
          >
            <div className="border-b border-[var(--vd-border)] px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <TabsList variant="underline" className="w-full justify-start">
                  <TabsTrigger value="components" variant="underline">
                    Components
                  </TabsTrigger>
                  <TabsTrigger value="outline" variant="underline">
                    Outline
                  </TabsTrigger>
                </TabsList>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      aria-pressed={leftPinned}
                      onClick={() => setLeftPinned((current) => !current)}
                    >
                      {leftPinned ? <PinOffIcon className="h-4 w-4" /> : <PinIcon className="h-4 w-4" />}
                      <span className="sr-only">{leftPinLabel}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{leftPinLabel}</TooltipContent>
                </Tooltip>
              </div>
            </div>
            <TabsContent value="components" className="mt-0 flex-1 overflow-y-auto p-4">
              <PatternLibrary
                patterns={PUCK_PATTERNS}
                disabled={Boolean(isGlobalRouteLocked)}
                onInsert={handleInsertPattern}
                onRequestUnlock={() => setIsUnlockDialogOpen(true)}
                showGlobalLock={isGlobalRouteLocked}
              />
              {isGlobalRouteLocked ? <Separator className="my-3" /> : null}
              <Puck.Components />
            </TabsContent>
            <TabsContent value="outline" className="mt-0 flex-1 overflow-y-auto p-4">
              <Puck.Outline />
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <Sheet
        open={propertiesOpen}
        modal={false}
        onOpenChange={(open) => {
          if (!open) {
            setActivePanel(null);
            if (propertiesPinned) setPropertiesPinned(false);
          }
        }}
      >
        <SheetContent
          side="right"
          className={rightPanelSheetClass}
          overlay={false}
          onInteractOutside={(event) => {
            if (propertiesPinned) event.preventDefault();
          }}
          onEscapeKeyDown={(event) => {
            if (propertiesPinned) event.preventDefault();
          }}
        >
          <div className="flex h-full flex-col">
            <SheetHeader className="border-b border-[var(--vd-border)] px-4 py-3">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-sm">Properties</SheetTitle>
                <SheetDescription className="sr-only">Edit the settings for the selected component.</SheetDescription>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      aria-pressed={propertiesPinned}
                      onClick={() => setPropertiesPinned((current) => !current)}
                    >
                      {propertiesPinned ? (
                        <PinOffIcon className="h-4 w-4" />
                      ) : (
                        <PinIcon className="h-4 w-4" />
                      )}
                      <span className="sr-only">{propertiesPinLabel}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{propertiesPinLabel}</TooltipContent>
                </Tooltip>
              </div>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto">
              <PropertiesPanel
                isGlobalRouteLocked={isGlobalRouteLocked}
                selectedItem={selectedItem}
                onUnlockGlobal={() => {
                  setIsUnlockDialogOpen(true);
                }}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={activePanel === 'settings'}
        modal={false}
        onOpenChange={(open) => {
          if (!open) setActivePanel(null);
        }}
      >
        <SheetContent
          side="right"
          className={rightPanelSheetClass}
          overlay={false}
        >
          <div className="flex h-full flex-col">
            <SheetHeader className="border-b border-[var(--vd-border)] px-4 py-3">
              <SheetTitle className="text-sm">Settings</SheetTitle>
              <SheetDescription className="sr-only">Edit page-level settings.</SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto">{settingsPanel}</div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={activePanel === 'theme'}
        onOpenChange={(open) => {
          if (!open) setActivePanel(null);
        }}
      >
        <SheetContent
          side="right"
          className={`${sheetPositionClass} w-[100vw] max-w-[100vw] gap-0 p-0 sm:max-w-none`}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Theme</SheetTitle>
            <SheetDescription>Adjust theme styles and typography for this site.</SheetDescription>
          </SheetHeader>
          {themePanel}
        </SheetContent>
      </Sheet>

      <Dialog open={isUnlockDialogOpen} onOpenChange={setIsUnlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlock global editing?</DialogTitle>
            <DialogDescription>
              {isGlobalHeader
                ? "This navigation appears on every page. Click 'Edit navigation' to make changes."
                : 'This is global content. Changes apply to all pages. Unlock to continue editing.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUnlockDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setIsUnlockDialogOpen(false);
                onUnlockGlobal?.();
              }}
            >
              {unlockLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
