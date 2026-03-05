'use client';

import '@measured/puck/no-external.css';

import { Puck, type Data } from '@measured/puck';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { editorConfig } from '@/puck/editor-config';
import { defaultData } from '@/puck/defaults';
import { sanitizeData } from '@/puck/validate';
import { PuckEditorShell } from '@/components/puck/editor/PuckEditorShell';
import { ThemeEditorDrawer } from '@/components/edit/theme-editor-drawer.client';
import { isSiteChromeSlug } from '@/lib/site-chrome-slugs';

type EditorClientProps = {
  initialData?: Data;
  initialSlug?: string;
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

export function EditorClient({ initialData, initialSlug }: EditorClientProps) {
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
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    let active = true;
    const seed =
      initialData && slug === (initialSlug || 'home')
        ? sanitizeData(initialData)
        : sanitizeData(defaultData(slug));
    setData(seed);
    setHasPublished(false);

    requestJson(`/api/cms/pages/${encodeURIComponent(slug)}`)
      .then((payload) => {
        if (!active) return;
        const draft = payload?.draftData ?? null;
        const published = payload?.publishedData ?? null;
        const nextData = draft || published || defaultData(slug);
        setData(sanitizeData(nextData));
        setHasPublished(Boolean(published));
      })
      .catch((error) => {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'Unable to load page data.';
        toast.error(message);
      });

    return () => {
      active = false;
    };
  }, [slug, initialData, initialSlug]);

  const baseUrl = `/api/cms/pages/${encodeURIComponent(slug)}`;

  const handleSave = async () => {
    setSaving(true);
    try {
      await requestJson(baseUrl, {
        method: 'PUT',
        body: JSON.stringify({ data })
      });
      toast.success('Draft saved');
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
        body: JSON.stringify({ data })
      });
      const response = await requestJson(`${baseUrl}/publish`, { method: 'POST' });
      setHasPublished(Boolean(response?.publishedData ?? true));
      toast.success('Page published');
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
      toast.success('Draft reset to published');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to reset draft';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    const closeHref = isSiteChromeSlug(slug)
      ? '/edit'
      : slug === 'home'
        ? '/'
        : `/${encodeURIComponent(slug)}`;
    router.push(closeHref);
  };

  const canvasHeightClassName = 'h-[calc(100dvh-9.5rem)] min-h-[32rem]';
  const canvasPaddingClassName = 'px-6 py-6';
  const canvasClassName = `mx-auto w-full max-w-6xl ${canvasPaddingClassName} ${canvasHeightClassName}`;

  return (
    <Puck config={editorConfig} data={data} onChange={(nextData) => setData(sanitizeData(nextData))}>
      <PuckEditorShell
        title={formatTitle(slug)}
        statusLabel={hasPublished ? 'Published' : 'Draft only'}
        onSaveDraft={handleSave}
        onResetDraft={handleReset}
        onPublish={handlePublish}
        themePanel={<ThemeEditorDrawer initialSlug={slug} />}
        onClose={handleClose}
        saveDisabled={saving || publishing}
        resetDisabled={!hasPublished || saving || publishing}
        publishDisabled={publishing}
        isSaving={saving}
        isPublishing={publishing}
      >
        <div className={canvasClassName}>
          <Puck.Preview />
        </div>
      </PuckEditorShell>
    </Puck>
  );
}
