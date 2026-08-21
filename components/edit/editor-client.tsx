'use client';

import '@puckeditor/core/no-external.css';

import { Puck, type Data } from '@puckeditor/core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { normalizeChapterSlug, normalizeChapterSlugs } from '@/lib/chapters';
import { editorConfig } from '@/puck/editor-config';
import { defaultData } from '@/puck/defaults';
import { sanitizeData } from '@/puck/validate';
import { type PatternPayload } from '@/lib/puck/patterns';
import { listLegacyPageComponents } from '@/lib/puck/legacy-page-components';
import { LEGACY_PAGE_TYPES } from '@/lib/puck/legacy-types';
import { PageEditorChapterSection } from '@/components/edit/page-editor-chapter-section';
import { buildId } from '@/components/puck/editor/puck-editor-shell-utils';
import { PuckEditorShell } from '@/components/puck/editor/PuckEditorShell';
import { EditorFieldLabel } from '@/components/puck/editor/editor-field-label';
import { CanvasImageDropZone } from '@/components/puck/editor/canvas-image-drop-zone.client';
import { ThemeEditorDrawer } from '@/components/edit/theme-editor-drawer.client';
import { isSiteChromeSlug } from '@/lib/site-chrome-slugs';

type EditorClientProps = {
  initialData?: Data;
  initialSlug?: string;
  isAdmin?: boolean;
  activeProfile?: {
    primaryChapterSlug: string;
    chapterSlugs: string[];
  } | null;
};

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

function formatTitle(slug: string) {
  if (slug === 'home') return 'Home';
  if (slug === 'global-header') return 'Global header';
  if (slug === 'global-footer') return 'Global footer';
  return slug.replace(/-/g, ' ');
}

function buildEditorBreadcrumbs(slug: string) {
  if (slug === 'global-header') {
    return [
      { label: 'Admin', href: '/edit' },
      { label: 'Site Design', href: '/edit?tab=pages' },
      { label: 'Edit Header' }
    ];
  }

  if (slug === 'global-footer') {
    return [
      { label: 'Admin', href: '/edit' },
      { label: 'Site Design', href: '/edit?tab=pages' },
      { label: 'Edit Footer' }
    ];
  }

  return [
    { label: 'Content', href: '/edit' },
    { label: 'Pages', href: '/edit?tab=pages' },
    { label: formatTitle(slug) }
  ];
}

function hasPendingPublishRequest(payload: unknown) {
  if (!payload || typeof payload !== 'object') return false;
  const typed = payload as {
    pendingApproval?: unknown;
    pendingPublishRequest?: { requestedAt?: unknown } | null;
  };
  if (typed.pendingApproval === true) return true;
  return Boolean(typed.pendingPublishRequest?.requestedAt);
}

const GLOBAL_EDITING_UNLOCKED_STORAGE_KEY_PREFIX = 'vd:asap-editor:global-editing:unlocked';
const CONVERTIBLE_LEGACY_COMPONENTS = new Set(LEGACY_PAGE_TYPES);

function globalEditingStorageKey(slug: string) {
  return `${GLOBAL_EDITING_UNLOCKED_STORAGE_KEY_PREFIX}:${slug}`;
}

function isGlobalEditingLocked(slug: string) {
  if (!isSiteChromeSlug(slug) || typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(globalEditingStorageKey(slug)) !== '1';
  } catch {
    return true;
  }
}

function persistGlobalEditingLockState(slug: string, locked: boolean) {
  if (!isSiteChromeSlug(slug) || typeof window === 'undefined') return;
  try {
    if (locked) {
      window.localStorage.removeItem(globalEditingStorageKey(slug));
    } else {
      window.localStorage.setItem(globalEditingStorageKey(slug), '1');
    }
  } catch {
    // Storage unavailable in some privacy settings.
  }
}

export function EditorClient({
  initialData,
  initialSlug,
  isAdmin = false,
  activeProfile = null
}: EditorClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = useMemo(
    () => searchParams.get('slug') || initialSlug || 'home',
    [searchParams, initialSlug]
  );
  const [data, setData] = useState<Data>(() =>
    sanitizeData(initialData && slug === (initialSlug || 'home') ? initialData : defaultData('home'))
  );
  const [hasPublished, setHasPublished] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [convertingLegacyTemplate, setConvertingLegacyTemplate] = useState(false);
  const [globalEditingLocked, setGlobalEditingLockedState] = useState(() => isSiteChromeSlug(slug));
  const [primaryChapterSlug, setPrimaryChapterSlug] = useState(() =>
    normalizeChapterSlug(activeProfile?.primaryChapterSlug)
  );
  const [chapterSlugs, setChapterSlugs] = useState<string[]>(() =>
    normalizeChapterSlugs(activeProfile?.chapterSlugs, activeProfile?.primaryChapterSlug)
  );
  const isGlobal = isSiteChromeSlug(slug);
  const puckOverrides = useMemo(() => ({ fieldLabel: EditorFieldLabel }), []);
  const puckIframe = useMemo(() => ({ enabled: false }), []);
  const legacyTemplateTypes = useMemo(() => listLegacyPageComponents(data), [data]);
  const canConvertLegacyTemplate = useMemo(
    () => legacyTemplateTypes.some((type) => CONVERTIBLE_LEGACY_COMPONENTS.has(type)),
    [legacyTemplateTypes]
  );

  useEffect(() => {
    if (!isGlobal) {
      setGlobalEditingLockedState(false);
      return;
    }
    setGlobalEditingLockedState(isGlobalEditingLocked(slug));
  }, [isGlobal, slug]);

  useEffect(() => {
    let active = true;
    const seed =
      initialData && slug === (initialSlug || 'home')
        ? sanitizeData(initialData)
        : sanitizeData(defaultData(slug));
    setData(seed);
    setHasPublished(false);
    setPendingApproval(false);
    setConvertingLegacyTemplate(false);
    setPrimaryChapterSlug(normalizeChapterSlug(activeProfile?.primaryChapterSlug));
    setChapterSlugs(normalizeChapterSlugs(activeProfile?.chapterSlugs, activeProfile?.primaryChapterSlug));

    requestJson(`/api/cms/pages/${encodeURIComponent(slug)}`)
      .then((payload) => {
        if (!active) return;
        const draft = payload?.draftData ?? null;
        const published = payload?.publishedData ?? null;
        const nextPrimaryChapterSlug = normalizeChapterSlug(
          payload?.primaryChapterSlug || activeProfile?.primaryChapterSlug
        );
        const nextChapterSlugs = normalizeChapterSlugs(
          payload?.chapterSlugs || activeProfile?.chapterSlugs,
          nextPrimaryChapterSlug
        );
        const nextData = draft || published || defaultData(slug);
        setData(sanitizeData(nextData));
        setHasPublished(Boolean(published));
        setPendingApproval(hasPendingPublishRequest(payload));
        setPrimaryChapterSlug(nextPrimaryChapterSlug);
        setChapterSlugs(nextChapterSlugs);
      })
      .catch((error) => {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'Unable to load page data.';
        toast.error(message);
      });

    return () => {
      active = false;
    };
  }, [slug, initialData, initialSlug, activeProfile]);

  const baseUrl = `/api/cms/pages/${encodeURIComponent(slug)}`;
  const pageOwnership = useMemo(
    () => ({
      primaryChapterSlug: normalizeChapterSlug(primaryChapterSlug),
      chapterSlugs: normalizeChapterSlugs(chapterSlugs, primaryChapterSlug)
    }),
    [chapterSlugs, primaryChapterSlug]
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await requestJson(baseUrl, {
        method: 'PUT',
        body: JSON.stringify({ data, pageOwnership })
      });
      setPendingApproval(hasPendingPublishRequest(response));
      setPrimaryChapterSlug(normalizeChapterSlug(response?.primaryChapterSlug || pageOwnership.primaryChapterSlug));
      setChapterSlugs(
        normalizeChapterSlugs(
          response?.chapterSlugs || pageOwnership.chapterSlugs,
          response?.primaryChapterSlug || pageOwnership.primaryChapterSlug
        )
      );
      toast.success('Saved');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save draft';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await requestJson(baseUrl, {
        method: 'PUT',
        body: JSON.stringify({ data, pageOwnership })
      });
      const response = await requestJson(`${baseUrl}/publish`, { method: 'POST' });
      const nextPending = hasPendingPublishRequest(response);
      setPendingApproval(nextPending);
      setHasPublished(Boolean(response?.publishedData));
      setPrimaryChapterSlug(normalizeChapterSlug(response?.primaryChapterSlug || pageOwnership.primaryChapterSlug));
      setChapterSlugs(
        normalizeChapterSlugs(
          response?.chapterSlugs || pageOwnership.chapterSlugs,
          response?.primaryChapterSlug || pageOwnership.primaryChapterSlug
        )
      );
      if (nextPending) {
        toast.success('Page submitted for admin approval');
      } else {
        toast.success('Page published');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to publish page';
      toast.error(message);
    } finally {
      setPublishing(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      const response = await requestJson(`${baseUrl}/reset-draft`, { method: 'POST' });
      const nextData = response?.draftData ?? response?.publishedData ?? defaultData(slug);
      setData(sanitizeData(nextData));
      setHasPublished(Boolean(response?.publishedData));
      setPendingApproval(hasPendingPublishRequest(response));
      setPrimaryChapterSlug(normalizeChapterSlug(response?.primaryChapterSlug || activeProfile?.primaryChapterSlug));
      setChapterSlugs(
        normalizeChapterSlugs(
          response?.chapterSlugs || activeProfile?.chapterSlugs,
          response?.primaryChapterSlug || activeProfile?.primaryChapterSlug
        )
      );
      toast.success('Draft reset to published');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to reset draft';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleConvertLegacyTemplate = async () => {
    if (!canConvertLegacyTemplate) {
      toast.error('No conversion template is configured for this legacy page.');
      return;
    }

    setConvertingLegacyTemplate(true);
    try {
      const response = await requestJson(`${baseUrl}/convert-legacy`, { method: 'POST' });
      const nextData = response?.draftData ?? response?.publishedData ?? data;
      setData(sanitizeData(nextData));
      setHasPublished(Boolean(response?.publishedData));
      setPendingApproval(hasPendingPublishRequest(response));
      setPrimaryChapterSlug(normalizeChapterSlug(response?.primaryChapterSlug || pageOwnership.primaryChapterSlug));
      setChapterSlugs(
        normalizeChapterSlugs(
          response?.chapterSlugs || pageOwnership.chapterSlugs,
          response?.primaryChapterSlug || pageOwnership.primaryChapterSlug
        )
      );
      if (response?.publishedUpdated) {
        if (response?.snapshotStored) {
          toast.success('Legacy template converted and published. Snapshot saved for rollback.');
        } else {
          toast.success('Legacy template converted and published.');
        }
      } else {
        if (response?.snapshotStored) {
          toast.success(
            'Legacy template converted to editable blocks in draft only. Live page is unchanged. Snapshot saved for rollback.'
          );
        } else {
          toast.success('Legacy template converted to editable blocks in draft only. Live page is unchanged.');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to convert legacy template';
      toast.error(message);
    } finally {
      setConvertingLegacyTemplate(false);
    }
  };

  const handleInsertPattern = useCallback((pattern: PatternPayload) => {
    setData((current) => {
      const currentContent = Array.isArray(current?.content) ? current.content : [];
      const incoming = pattern.blocksPayload.map((block, index) => ({
        type: block.type,
        props: {
          ...(typeof block.props === 'object' && block.props ? (block.props as Record<string, unknown>) : {}),
          id: buildId(block.type, index)
        }
      }));

      return sanitizeData({
        ...(current || defaultData(slug)),
        content: [...currentContent, ...incoming]
      });
    });
  }, [slug]);

  const handleClose = () => {
    router.push('/edit');
  };

  const canvasHeightClassName = 'h-[calc(100dvh-9.5rem)] min-h-[32rem]';
  const canvasPaddingClassName = 'px-6 py-6';
  const canvasClassName = `mx-auto w-full max-w-6xl ${canvasPaddingClassName} ${canvasHeightClassName}`;

  // Puck merges each new global permissions object over the previous one
  // ({...existing, ...next}), so passing `undefined` after a locked object
  // would leave all the `false`s in place forever. Pass explicit `true`s
  // when unlocked so the merge actually restores editing.
  const permissions = isGlobal
    ? globalEditingLocked
      ? {
          insert: false,
          edit: false,
          duplicate: false,
          delete: false,
          drag: false
        }
      : {
          insert: true,
          edit: true,
          duplicate: true,
          delete: true,
          drag: true
        }
    : undefined;

  const handleUnlockGlobal = () => {
    setGlobalEditingLockedState(false);
    persistGlobalEditingLockState(slug, false);
  };

  const handleLockGlobal = () => {
    setGlobalEditingLockedState(true);
    persistGlobalEditingLockState(slug, true);
  };

  const handlePrimaryChapterChange = useCallback((value: string) => {
    const nextPrimaryChapterSlug = normalizeChapterSlug(value);
    setPrimaryChapterSlug(nextPrimaryChapterSlug);
    setChapterSlugs((current) => normalizeChapterSlugs(current, nextPrimaryChapterSlug));
  }, []);

  const handleChapterToggle = useCallback(
    (slugValue: string, checked: boolean) => {
      setChapterSlugs((current) => {
        const next = checked ? [...current, slugValue] : current.filter((value) => value !== slugValue);
        return normalizeChapterSlugs(next, primaryChapterSlug);
      });
    },
    [primaryChapterSlug]
  );

  const settingsPanel = !isGlobal ? (
    <div className="min-w-0 p-4">
      <PageEditorChapterSection
        primaryChapterSlug={primaryChapterSlug}
        chapterSlugs={chapterSlugs}
        onPrimaryChapterChange={handlePrimaryChapterChange}
        onChapterToggle={handleChapterToggle}
      />
    </div>
  ) : null;

  return (
    <Puck
      config={editorConfig}
      data={data}
      iframe={puckIframe}
      overrides={puckOverrides}
      permissions={permissions}
      onChange={(nextData) => setData(sanitizeData(nextData))}
    >
      <PuckEditorShell
        title={formatTitle(slug)}
        breadcrumbs={buildEditorBreadcrumbs(slug)}
        statusLabel={pendingApproval ? 'Pending approval' : hasPublished ? 'Published' : 'Draft only'}
        onSaveDraft={handleSave}
        onResetDraft={handleReset}
        onPublish={handlePublish}
        publishLabel={isAdmin ? 'Publish' : pendingApproval ? 'Resubmit for approval' : 'Submit for approval'}
        publishingLabel={isAdmin ? 'Publishing...' : 'Submitting...'}
        closeLabel="Back to dashboard"
        themePanel={<ThemeEditorDrawer initialSlug={slug} />}
        settingsPanel={settingsPanel}
        onInsertPattern={handleInsertPattern}
        legacyTemplateTypes={legacyTemplateTypes}
        onConvertLegacyTemplate={canConvertLegacyTemplate ? handleConvertLegacyTemplate : undefined}
        isConvertingLegacyTemplate={convertingLegacyTemplate}
        onClose={handleClose}
        saveDisabled={saving || publishing || convertingLegacyTemplate}
        resetDisabled={!hasPublished || saving || publishing || convertingLegacyTemplate}
        publishDisabled={publishing || convertingLegacyTemplate}
        isSaving={saving}
        isPublishing={publishing}
        isGlobal={isGlobal}
        isGlobalEditingLocked={globalEditingLocked}
        onUnlockGlobal={handleUnlockGlobal}
        onLockGlobal={handleLockGlobal}
      >
        <div className={canvasClassName}>
          <CanvasImageDropZone disabled={isGlobal && globalEditingLocked}>
            <Puck.Preview />
          </CanvasImageDropZone>
        </div>
      </PuckEditorShell>
    </Puck>
  );
}
