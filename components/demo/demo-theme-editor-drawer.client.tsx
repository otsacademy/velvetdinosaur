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
    <ThemeEditorView
      pages={pages}
      selectedSlug={initialSlug}
      actions={{
        saveDraft: async () => {
          toast.info('This is a live demonstration, so theme changes are not saved.');
        },
        publish: async () => {
          toast.info('Publishing is unavailable in this demonstration.');
        },
        reset: async () => {
          toast.success('The demonstration theme has been reset.');
          return { payload: initialPayload ?? null };
        }
      }}
    >
      <main className="mx-auto w-full max-w-[1500px] space-y-16 px-8 py-12">
        <Render config={editorConfig} data={previewData} />
      </main>
    </ThemeEditorView>
  );
}
