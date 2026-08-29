'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { createUsePuck, registerOverlayPortal } from '@puckeditor/core';
import { AlignCenter, AlignLeft, AlignRight, Crop, ImageIcon, RotateCcw } from 'lucide-react';
import { AssetPickerField } from '@/components/puck/fields/asset-picker-field';
import { OptimizedImage, type OptimizedImageProps } from '@/components/ui/optimized-image';
import { cn } from '@/lib/utils';

export type CanvasImageSettings = {
  width?: number;
  align?: 'left' | 'center' | 'right';
  aspectRatio?: 'original' | '1/1' | '4/3' | '16/9';
  focalX?: number;
  focalY?: number;
};

type ImageEditContextValue = {
  componentId?: string;
  editing: boolean;
  edits: Record<string, CanvasImageSettings>;
};

const ImageEditContext = React.createContext<ImageEditContextValue>({
  editing: false,
  edits: {}
});

export function ImageEditProvider({
  componentId,
  editing,
  edits,
  children
}: {
  componentId?: string;
  editing?: boolean;
  edits?: Record<string, CanvasImageSettings>;
  children?: React.ReactNode;
}) {
  const value = React.useMemo(
    () => ({ componentId, editing: Boolean(editing), edits: edits || {} }),
    [componentId, editing, edits]
  );
  return <ImageEditContext.Provider value={value}>{children}</ImageEditContext.Provider>;
}

export function useImageEditSettings(sourcePath: string) {
  const context = React.useContext(ImageEditContext);
  return context.edits[sourcePath] || {};
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function finiteNumberOr(value: unknown, fallback: number) {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeSettings(value: CanvasImageSettings | undefined): Required<CanvasImageSettings> {
  return {
    width: clamp(finiteNumberOr(value?.width, 100), 20, 100),
    align: value?.align || 'center',
    aspectRatio: value?.aspectRatio || 'original',
    focalX: clamp(finiteNumberOr(value?.focalX, 50), 0, 100),
    focalY: clamp(finiteNumberOr(value?.focalY, 50), 0, 100)
  };
}

function parsePath(path: string) {
  return path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .map((part) => part.trim())
    .filter(Boolean);
}

function setDeep(source: Record<string, unknown>, path: string, value: unknown) {
  const parts = parsePath(path);
  if (!parts.length) return source;
  const root: Record<string, unknown> = { ...source };
  let current: Record<string, unknown> | unknown[] = root;

  parts.forEach((part, index) => {
    const isLast = index === parts.length - 1;
    if (isLast) {
      if (Array.isArray(current)) current[Number(part)] = value;
      else current[part] = value;
      return;
    }

    const nextPart = parts[index + 1];
    const nextIsArray = /^\d+$/.test(nextPart);
    const previous = Array.isArray(current) ? current[Number(part)] : current[part];
    const next = nextIsArray
      ? Array.isArray(previous)
        ? [...previous]
        : []
      : previous && typeof previous === 'object' && !Array.isArray(previous)
        ? { ...(previous as Record<string, unknown>) }
        : {};

    if (Array.isArray(current)) current[Number(part)] = next;
    else current[part] = next;
    current = next;
  });

  return root;
}

function inferAltPath(sourcePath: string) {
  if (sourcePath.endsWith('.src')) return `${sourcePath.slice(0, -4)}.alt`;
  if (sourcePath === 'src') return 'alt';
  if (/Src$/.test(sourcePath)) return sourcePath.replace(/Src$/, 'Alt');
  if (/Image$/.test(sourcePath)) return `${sourcePath}Alt`;
  return null;
}

function layoutStyle(
  style: React.CSSProperties | undefined,
  settings: Required<CanvasImageSettings>,
  applyLayout: boolean
) {
  const next: React.CSSProperties = {
    ...style,
    objectPosition: `${settings.focalX}% ${settings.focalY}%`
  };
  if (!applyLayout) return next;

  next.maxWidth = '100%';
  next.width = `${settings.width}%`;
  if (settings.align === 'left') {
    next.marginLeft = 0;
    next.marginRight = 'auto';
  } else if (settings.align === 'right') {
    next.marginLeft = 'auto';
    next.marginRight = 0;
  } else {
    next.marginLeft = 'auto';
    next.marginRight = 'auto';
  }
  if (settings.aspectRatio !== 'original') {
    next.aspectRatio = settings.aspectRatio.replace('/', ' / ');
    next.objectFit = 'cover';
  }
  return next;
}

const usePuckStore = createUsePuck();

function getEditorComponentId(element: HTMLElement | null) {
  const owner = element?.closest<HTMLElement>('[data-puck-component]');
  if (!owner?.closest('[data-puck-preview-mode="edit"]')) return null;
  return owner.dataset.puckComponent || null;
}

type EditableOptimizedImageProps = OptimizedImageProps extends infer Props
  ? Props extends OptimizedImageProps
    ? Omit<Props, 'src' | 'alt' | 'className' | 'style'>
    : never
  : never;

type EditableImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string | null;
  sourcePath?: string;
  applyLayout?: boolean;
  optimized?: EditableOptimizedImageProps;
};

export function EditableImage({
  src,
  alt = '',
  sourcePath,
  applyLayout = true,
  optimized,
  className,
  style,
  ...imageProps
}: EditableImageProps) {
  const context = React.useContext(ImageEditContext);
  const detectionRef = React.useRef<HTMLImageElement | null>(null);
  const [detectedComponentId, setDetectedComponentId] = React.useState<string | null>(null);
  const settings = normalizeSettings(sourcePath ? context.edits[sourcePath] : undefined);
  React.useEffect(() => {
    const cleanupPortal = registerOverlayPortal(detectionRef.current, { disableDrag: true });
    let attempts = 0;
    let frame = 0;
    const detect = () => {
      const componentId = getEditorComponentId(detectionRef.current);
      if (componentId) {
        setDetectedComponentId(componentId);
        return;
      }
      attempts += 1;
      if (attempts < 120) frame = requestAnimationFrame(detect);
    };
    detect();
    return () => {
      cancelAnimationFrame(frame);
      cleanupPortal?.();
    };
  }, []);
  const componentId = context.componentId || detectedComponentId || undefined;
  const editing = context.editing || Boolean(detectedComponentId);
  const hasStoredSettings = Boolean(sourcePath && context.edits[sourcePath]);
  const sharedProps = {
    src: src || '',
    alt,
    className,
    style: editing || hasStoredSettings ? layoutStyle(style, settings, applyLayout) : style
  };

  if (!editing || !componentId || !sourcePath) {
    if (optimized) {
      return <OptimizedImage ref={detectionRef} {...optimized} {...sharedProps} />;
    }
    // eslint-disable-next-line @next/next/no-img-element
    return <img ref={detectionRef} {...imageProps} {...sharedProps} alt={String(alt || '')} />;
  }

  return (
    <CanvasEditableImage
      {...imageProps}
      {...sharedProps}
      sourcePath={sourcePath}
      componentId={componentId}
      settings={settings}
      applyLayout={applyLayout}
      optimized={optimized}
    />
  );
}

function CanvasEditableImage({
  componentId,
  sourcePath,
  settings,
  applyLayout,
  optimized,
  src,
  alt,
  className,
  style,
  ...imageProps
}: Omit<EditableImageProps, 'sourcePath'> & {
  componentId: string;
  sourcePath: string;
  settings: Required<CanvasImageSettings>;
}) {
  const dispatch = usePuckStore((state) => state.dispatch);
  const getSelectorForId = usePuckStore((state) => state.getSelectorForId);
  const getItemById = usePuckStore((state) => state.getItemById);
  const imageRef = React.useRef<HTMLImageElement | null>(null);
  const portalCleanupRef = React.useRef<(() => void) | null>(null);
  const toolbarPortalCleanupRef = React.useRef<(() => void) | null>(null);
  const [portalDocument, setPortalDocument] = React.useState<Document | null>(null);
  const [selected, setSelected] = React.useState(false);
  const [replaceOpen, setReplaceOpen] = React.useState(false);
  const [cropOpen, setCropOpen] = React.useState(false);
  const [draftSettings, setDraftSettings] = React.useState(settings);
  const draftSettingsRef = React.useRef(settings);
  const [draftWidth, setDraftWidth] = React.useState(settings.width);
  const [overlay, setOverlay] = React.useState<DOMRect | null>(null);
  const altPath = inferAltPath(sourcePath);
  const setImageNode = React.useCallback((node: HTMLImageElement | null) => {
    portalCleanupRef.current?.();
    portalCleanupRef.current = null;
    imageRef.current = node;
    if (node) {
      portalCleanupRef.current = registerOverlayPortal(node, { disableDrag: true }) || null;
    }
    setPortalDocument(node?.ownerDocument || null);
  }, []);

  const setToolbarNode = React.useCallback((node: HTMLDivElement | null) => {
    toolbarPortalCleanupRef.current?.();
    toolbarPortalCleanupRef.current = node
      ? registerOverlayPortal(node, { disableDrag: true }) || null
      : null;
  }, []);

  React.useEffect(() => () => {
    portalCleanupRef.current?.();
    toolbarPortalCleanupRef.current?.();
  }, []);

  React.useEffect(() => {
    draftSettingsRef.current = settings;
    setDraftSettings(settings);
    setDraftWidth(settings.width);
  }, [settings]);

  const refreshOverlay = React.useCallback(() => {
    if (imageRef.current) setOverlay(imageRef.current.getBoundingClientRect());
  }, []);

  React.useEffect(() => {
    if (!selected) return;
    const win = imageRef.current?.ownerDocument.defaultView;
    const hostWin = win?.frameElement?.ownerDocument.defaultView;
    refreshOverlay();
    win?.addEventListener('resize', refreshOverlay);
    win?.addEventListener('scroll', refreshOverlay, true);
    if (hostWin && hostWin !== win) {
      hostWin.addEventListener('resize', refreshOverlay);
      hostWin.addEventListener('scroll', refreshOverlay, true);
    }
    return () => {
      win?.removeEventListener('resize', refreshOverlay);
      win?.removeEventListener('scroll', refreshOverlay, true);
      if (hostWin && hostWin !== win) {
        hostWin.removeEventListener('resize', refreshOverlay);
        hostWin.removeEventListener('scroll', refreshOverlay, true);
      }
    };
  }, [refreshOverlay, selected]);

  React.useEffect(() => {
    const win = imageRef.current?.ownerDocument.defaultView;
    if (!win) return;
    const handleSelection = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (detail !== `${componentId}:${sourcePath}`) {
        setSelected(false);
        setReplaceOpen(false);
        setCropOpen(false);
      }
    };
    win.addEventListener('vd-puck-image-select', handleSelection);
    return () => win.removeEventListener('vd-puck-image-select', handleSelection);
  }, [componentId, sourcePath]);

  const replaceProps = React.useCallback(
    (updater: (props: Record<string, unknown>) => Record<string, unknown>) => {
      const item = getItemById(componentId);
      const selector = getSelectorForId(componentId);
      if (!item || !selector) return;
      dispatch({
        type: 'replace',
        destinationIndex: selector.index,
        destinationZone: selector.zone,
        data: {
          ...item,
          props: {
            id: componentId,
            ...updater((item.props || {}) as Record<string, unknown>)
          }
        },
        recordHistory: true
      });
    },
    [componentId, dispatch, getItemById, getSelectorForId]
  );

  const updateSource = (next: string) => {
    replaceProps((props) => setDeep(props, sourcePath, next));
  };

  const updateAlt = (next: string) => {
    if (!altPath) return;
    replaceProps((props) => setDeep(props, altPath, next));
  };

  const updateSettings = (next: Partial<CanvasImageSettings>) => {
    const optimisticSettings = { ...draftSettingsRef.current, ...next };
    draftSettingsRef.current = optimisticSettings;
    setDraftSettings(optimisticSettings);
    if (typeof next.width === 'number') setDraftWidth(next.width);
    replaceProps((props) => {
      const currentEdits = (props.__vdImageEdits as Record<string, CanvasImageSettings>) || {};
      return {
        ...props,
        __vdImageEdits: {
          ...currentEdits,
          [sourcePath]: { ...normalizeSettings(currentEdits[sourcePath]), ...optimisticSettings }
        }
      };
    });
  };

  const selectImage = () => {
    const win = imageRef.current?.ownerDocument.defaultView;
    win?.dispatchEvent(
      new CustomEvent('vd-puck-image-select', { detail: `${componentId}:${sourcePath}` })
    );
    setSelected(true);
    requestAnimationFrame(refreshOverlay);
  };

  const startResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const handle = event.currentTarget;
    const win = imageRef.current?.ownerDocument.defaultView;
    const parentWidth = imageRef.current?.parentElement?.getBoundingClientRect().width || overlay?.width || 1;
    if (!win) return;
    const startX = event.clientX;
    const startWidth = draftWidth;
    let finalWidth = startWidth;

    const move = (moveEvent: PointerEvent) => {
      finalWidth = clamp(startWidth + ((moveEvent.clientX - startX) / parentWidth) * 100, 20, 100);
      setDraftWidth(finalWidth);
      requestAnimationFrame(refreshOverlay);
    };
    const finish = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', finish);
      handle.removeEventListener('pointercancel', finish);
      if (handle.hasPointerCapture(event.pointerId)) {
        handle.releasePointerCapture(event.pointerId);
      }
      updateSettings({ width: Math.round(finalWidth) });
    };
    handle.setPointerCapture(event.pointerId);
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', finish, { once: true });
    handle.addEventListener('pointercancel', finish, { once: true });
  };

  const currentSettings = { ...draftSettings, width: draftWidth };
  const sharedProps = {
    src: src || '',
    alt: String(alt || ''),
    className: cn(className, selected && 'outline outline-2 outline-offset-2 outline-[var(--vd-primary)]'),
    style: layoutStyle(style, currentSettings, applyLayout !== false),
    'data-puck-overlay-portal': true,
    role: 'button' as const,
    tabIndex: 0,
    'aria-label': `Edit image${alt ? `: ${String(alt)}` : ''}`,
    onPointerDownCapture: (event: React.PointerEvent<HTMLImageElement>) => {
      event.stopPropagation();
    },
    onClick: (event: React.MouseEvent<HTMLImageElement>) => {
      imageRef.current = event.currentTarget;
      imageProps.onClick?.(event);
      selectImage();
    },
    onKeyDown: (event: React.KeyboardEvent<HTMLImageElement>) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      event.stopPropagation();
      selectImage();
    }
  };

  const image = optimized ? (
    <OptimizedImage ref={setImageNode} {...optimized} {...sharedProps} />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...imageProps} {...sharedProps} alt={String(alt || '')} ref={setImageNode} />
  );

  const frameElement = portalDocument?.defaultView?.frameElement as HTMLElement | null;
  const overlayDocument = frameElement?.ownerDocument || portalDocument;
  const frameRect = frameElement?.getBoundingClientRect();
  const frameOffsetX = frameRect?.left || 0;
  const frameOffsetY = frameRect?.top || 0;
  const overlayLeft = (overlay?.left || 0) + frameOffsetX;
  const overlayRight = (overlay?.right || 0) + frameOffsetX;
  const overlayTop = (overlay?.top || 0) + frameOffsetY;
  const overlayBottom = (overlay?.bottom || 0) + frameOffsetY;
  const overlayViewportHeight = overlayDocument?.defaultView?.innerHeight || overlayBottom;

  const resizeHandleTop = overlay && overlayDocument
    ? clamp(
        overlayTop + overlay.height / 2,
        72,
        Math.max(72, overlayViewportHeight - 96)
      )
    : 72;
  const toolbarPanelHeight = cropOpen ? 240 : replaceOpen ? 440 : 56;
  const toolbarTop = overlay && overlayDocument
    ? clamp(
        overlayTop - 52,
        72,
        Math.max(72, overlayViewportHeight - 112 - toolbarPanelHeight)
      )
    : 72;

  const overlayNode = selected && overlay && overlayDocument ? (
    <div
      ref={setToolbarNode}
      data-vd-image-toolbar
      data-puck-overlay-portal
      className="fixed z-[60]"
      style={{ left: overlayLeft, top: toolbarTop, width: overlay.width, zIndex: 2147480000, pointerEvents: 'auto' }}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex w-fit max-w-[calc(100vw-1rem)] items-center gap-1 overflow-x-auto rounded-md border border-[var(--vd-border)] bg-[var(--vd-bg)] p-1 text-[var(--vd-fg)] shadow-lg">
        <button className="inline-flex h-11 items-center gap-1 rounded px-2 text-xs hover:bg-[var(--vd-muted)]" type="button" onClick={() => { setReplaceOpen((value) => !value); setCropOpen(false); }}>
          <ImageIcon className="h-3.5 w-3.5" /> Replace
        </button>
        <button className="inline-flex h-11 items-center gap-1 rounded px-2 text-xs hover:bg-[var(--vd-muted)]" type="button" onClick={() => { setCropOpen((value) => !value); setReplaceOpen(false); }}>
          <Crop className="h-3.5 w-3.5" /> Crop
        </button>
        <button className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded hover:bg-[var(--vd-muted)]" type="button" aria-label="Align image left" onClick={() => updateSettings({ align: 'left' })}><AlignLeft className="h-3.5 w-3.5" /></button>
        <button className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded hover:bg-[var(--vd-muted)]" type="button" aria-label="Align image centre" onClick={() => updateSettings({ align: 'center' })}><AlignCenter className="h-3.5 w-3.5" /></button>
        <button className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded hover:bg-[var(--vd-muted)]" type="button" aria-label="Align image right" onClick={() => updateSettings({ align: 'right' })}><AlignRight className="h-3.5 w-3.5" /></button>
        <button className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded hover:bg-[var(--vd-muted)]" type="button" aria-label="Reset image layout" onClick={() => updateSettings({ width: 100, align: 'center', aspectRatio: 'original', focalX: 50, focalY: 50 })}><RotateCcw className="h-3.5 w-3.5" /></button>
        <label className="flex h-11 shrink-0 items-center gap-1 px-1 text-[11px] text-[var(--vd-muted-fg)]">
          Width
          <input
            aria-label="Image width percent"
            className="h-9 w-16 rounded border border-[var(--vd-border)] bg-[var(--vd-bg)] px-2 text-sm tabular-nums text-[var(--vd-fg)]"
            type="number"
            min="20"
            max="100"
            value={Math.round(draftWidth)}
            onChange={(event) =>
              updateSettings({
                width: clamp(Number(event.currentTarget.value) || 20, 20, 100)
              })
            }
            onBlur={() => updateSettings({ width: Math.round(draftWidth) })}
            onKeyDown={(event) => {
              if (event.key === 'Enter') updateSettings({ width: Math.round(draftWidth) });
            }}
          />
          <span aria-hidden="true">%</span>
        </label>
      </div>

      {replaceOpen ? (
        <div className="mt-2 w-[min(28rem,calc(100vw-2rem))] rounded-lg border border-[var(--vd-border)] bg-[var(--vd-bg)] p-3 shadow-xl">
          <AssetPickerField value={String(src || '')} onChange={updateSource} compact autoUploadOnDrop showAdvancedOptions={false} showSelectedAssetMeta={false} />
          {altPath ? (
            <label className="mt-3 block text-xs font-medium text-[var(--vd-fg)]">
              Alternative text
              <input className="mt-1 h-9 w-full rounded-md border border-[var(--vd-border)] bg-[var(--vd-bg)] px-3 text-sm" defaultValue={String(alt || '')} onBlur={(event) => updateAlt(event.currentTarget.value)} />
            </label>
          ) : null}
        </div>
      ) : null}

      {cropOpen ? (
        <div className="mt-2 w-72 rounded-lg border border-[var(--vd-border)] bg-[var(--vd-bg)] p-3 text-xs text-[var(--vd-fg)] shadow-xl">
          <div className="mb-2 font-medium">Aspect ratio</div>
          <div className="mb-3 flex gap-1">
            {(['original', '1/1', '4/3', '16/9'] as const).map((ratio) => (
              <button key={ratio} type="button" className={cn('rounded border px-2 py-1.5', currentSettings.aspectRatio === ratio ? 'border-[var(--vd-primary)] bg-[var(--vd-primary)] text-[var(--vd-primary-fg)]' : 'border-[var(--vd-border)]')} onClick={() => updateSettings({ aspectRatio: ratio })}>{ratio === 'original' ? 'Original' : ratio}</button>
            ))}
          </div>
          <label className="block">Focal point X
            <input className="mt-1 w-full accent-[var(--vd-primary)]" type="range" min="0" max="100" value={currentSettings.focalX} onInput={(event) => updateSettings({ focalX: Number(event.currentTarget.value) })} />
          </label>
          <label className="mt-2 block">Focal point Y
            <input className="mt-1 w-full accent-[var(--vd-primary)]" type="range" min="0" max="100" value={currentSettings.focalY} onInput={(event) => updateSettings({ focalY: Number(event.currentTarget.value) })} />
          </label>
        </div>
      ) : null}

      <button
        type="button"
        aria-label="Resize image"
        className="fixed z-[61] flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize touch-none items-center justify-center rounded-full bg-transparent"
        style={{ left: overlayRight, top: resizeHandleTop, zIndex: 2147480001, pointerEvents: 'auto' }}
        onPointerDown={startResize}
      >
        <span className="block h-11 w-3 rounded-full border border-[var(--vd-primary)] bg-[var(--vd-bg)] shadow-md" />
      </button>
    </div>
  ) : null;

  return (
    <>
      {image}
      {overlayNode && overlayDocument?.body ? createPortal(overlayNode, overlayDocument.body) : null}
    </>
  );
}
