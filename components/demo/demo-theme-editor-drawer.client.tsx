'use client';

import { Render, type Data } from '@puckeditor/core';
import { toast } from 'sonner';
import type { ThemeStatePayload } from 'tweakcn-ui';
import { ThemeEditorView } from '@/components/admin/theme/theme-editor-view.client';
import { editorConfig } from '@/puck/editor-config';

type DemoThemeEditorDrawerProps = {
  initialSlug: string;
  previewData: Data;
  initialPayload?: ThemeStatePayload | null;
};

function formatPageLabel(slug: string) {
  if (slug === 'home') return 'Home';
  return slug.replace(/-/g, ' ');
}

export function DemoThemeEditorDrawer({
  initialSlug,
  previewData,
  initialPayload
}: DemoThemeEditorDrawerProps) {
  const pages = [{ slug: initialSlug, title: formatPageLabel(initialSlug) }];

  return (
    // Demo reconciliation TODO: the converged ThemeEditorView handles
    // save/publish/reset internally, so the demo interception props are gone;
    // restore demo behaviour via a core demo-mode seam before deploy.
    <ThemeEditorView
      pages={pages}
      selectedSlug={initialSlug}
    >
      <main className="mx-auto w-full max-w-[1500px] space-y-16 px-8 py-12">
        <Render config={editorConfig} data={previewData} />
      </main>
    </ThemeEditorView>
  );
}
