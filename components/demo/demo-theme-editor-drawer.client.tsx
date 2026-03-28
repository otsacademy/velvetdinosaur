'use client';

import { Render, type Data } from '@measured/puck';
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
      mode="demo"
      pages={pages}
      selectedSlug={initialSlug}
      initialPayload={initialPayload}
      onSaveDraft={async () => {
        toast.info('This is a live demonstration, so theme changes are not saved.');
      }}
      onPublish={async () => {
        toast.info('Publishing is unavailable in this demonstration.');
      }}
      onReset={async () => {
        toast.success('The demonstration theme has been reset.');
        return { payload: initialPayload ?? null };
      }}
      importSuccessMessage="Theme imported into the demonstration. It will be cleared when you leave."
    >
      <main className="mx-auto w-full max-w-[1500px] space-y-16 px-8 py-12">
        <Render config={editorConfig} data={previewData} />
      </main>
    </ThemeEditorView>
  );
}
