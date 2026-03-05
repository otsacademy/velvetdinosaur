'use client';

import * as React from 'react';
import { Puck, createUsePuck } from '@measured/puck';
import { LayoutGrid, ListTree, Palette, Send, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MenuDock, MenuDockItem } from '@/components/ui/menu-dock';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type EditorPanel = 'components' | 'outline' | 'properties' | 'theme' | null;

const usePuckStore = createUsePuck();

type PinIconProps = {
  className?: string;
};

function getSelectedKey(selectedItem: unknown): string | null {
  if (!selectedItem) return null;
  if (typeof selectedItem === 'string') return selectedItem;
  if (typeof selectedItem === 'object' && 'id' in selectedItem) {
    const id = (selectedItem as { id?: unknown }).id;
    if (typeof id === 'string' && id.trim()) return id;
  }
  return null;
}

function PinIcon({ className }: PinIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 17v5" />
      <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
    </svg>
  );
}

function PinOffIcon({ className }: PinIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 17v5" />
      <path d="M15 9.34V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H7.89" />
      <path d="m2 2 20 20" />
      <path d="M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h11" />
    </svg>
  );
}

function PropertiesPanel() {
  const selectedItem = usePuckStore((state) => state.selectedItem);

  if (!selectedItem) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-sm text-[var(--vd-muted-fg)]">
        Select a block to edit its settings.
      </div>
    );
  }

  return <Puck.Fields />;
}

export type PuckEditorShellProps = {
  children: React.ReactNode;
  title: string;
  statusLabel?: string;
  onPublish: () => void;
  onSaveDraft: () => void;
  onResetDraft?: () => void;
  onOpenTheme?: () => void;
  themePanel?: React.ReactNode;
  onClose: () => void;
  saveDisabled?: boolean;
  publishDisabled?: boolean;
  resetDisabled?: boolean;
  isSaving?: boolean;
  isPublishing?: boolean;
};

export function PuckEditorShell({
  children,
  title,
  statusLabel,
  onPublish,
  onSaveDraft,
  onResetDraft,
  onOpenTheme,
  themePanel,
  onClose,
  saveDisabled,
  publishDisabled,
  resetDisabled,
  isSaving,
  isPublishing
}: PuckEditorShellProps) {
  const selectedItem = usePuckStore((state) => state.selectedItem);
  const [activePanel, setActivePanel] = React.useState<EditorPanel>(null);
  const [leftPinned, setLeftPinned] = React.useState(false);
  const [propertiesPinned, setPropertiesPinned] = React.useState(false);
  const [leftPanelTab, setLeftPanelTab] = React.useState<'components' | 'outline'>('components');
  const selectedKey = React.useMemo(() => getSelectedKey(selectedItem), [selectedItem]);
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

  React.useEffect(() => {
    if (!selectedKey) {
      lastSelectedKeyRef.current = null;
      return;
    }
    if (selectedKey === lastSelectedKeyRef.current) return;
    lastSelectedKeyRef.current = selectedKey;
    if (propertiesPinned) return;
    if (activePanel === 'theme') return;
    setActivePanel('properties');
  }, [selectedKey, propertiesPinned, activePanel]);

  const saveLabel = isSaving ? 'Saving...' : 'Save draft';
  const publishLabel = isPublishing ? 'Publishing...' : 'Publish';

  return (
    <div className="relative min-h-screen bg-[var(--vd-bg)]">
      <div className="fixed inset-x-0 top-0 z-40 border-b border-[var(--vd-border)] bg-[var(--vd-bg)] backdrop-blur">
        <div className="flex h-12 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="truncate text-sm font-semibold text-[var(--vd-fg)]">{title}</span>
            {statusLabel ? (
              <span className="rounded-full bg-[var(--vd-muted)] px-2 py-0.5 text-[11px] text-[var(--vd-muted-fg)]">
                {statusLabel}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
            <Button
              size="sm"
              onClick={onPublish}
              disabled={publishDisabled || isPublishing}
            >
              {publishLabel}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>

      <div className="relative pb-24 pt-14">{children}</div>

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
        className="top-12 h-[calc(100dvh-3rem)] gap-0 p-0 sm:max-w-sm"
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
                      {leftPinned ? (
                        <PinOffIcon className="h-4 w-4" />
                      ) : (
                        <PinIcon className="h-4 w-4" />
                      )}
                      <span className="sr-only">{leftPinLabel}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{leftPinLabel}</TooltipContent>
                </Tooltip>
              </div>
            </div>
            <TabsContent value="components" className="mt-0 flex-1 overflow-y-auto p-4">
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
          className="top-12 h-[calc(100dvh-3rem)] gap-0 p-0 sm:max-w-sm"
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
                <SheetDescription className="sr-only">
                  Edit the settings for the selected component.
                </SheetDescription>
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
            <div className="flex-1 overflow-y-auto p-4">
              <PropertiesPanel />
            </div>
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
          className="top-12 h-[calc(100dvh-3rem)] w-[100vw] max-w-[100vw] gap-0 p-0 sm:max-w-none"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Theme</SheetTitle>
            <SheetDescription>Adjust theme styles and typography for this site.</SheetDescription>
          </SheetHeader>
          {themePanel}
        </SheetContent>
      </Sheet>
    </div>
  );
}
