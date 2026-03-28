'use client';

import { KEYS } from 'platejs';
import { Plate, PlateContent, type PlateEditor } from 'platejs/react';
import { NewsDocumentToolbar } from '@/components/edit/news-editor/news-document-toolbar';
import { NewsEditorFloatingToolbar } from '@/components/edit/news-editor/news-editor-floating-toolbar';
import { NewsEditorSettingsPanel, type NewsPublishMode } from '@/components/edit/news-editor/news-editor-settings-panel';
import { cn } from '@/lib/utils';
import { TocSidebar } from '@/registry/ui/toc-sidebar';

type DemoNewsEditorWorkspaceProps = {
  editor: PlateEditor;
  content: unknown[];
  onContentChange: (value: unknown[]) => void;
  showSettings: boolean;
  editorFullWidth: boolean;
  editorSmallText: boolean;
  editorLockPage: boolean;
  title: string;
  authorName: string;
  publishDate: string;
  tag: string;
  onTitleChange: (value: string) => void;
  onEditorKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onInsertImage: () => void;
  onInsertVideo: () => void;
  onInsertFile: () => void;
  onOpenMagic: () => void;
  onInsertComment: () => void;
  stats: { words: number; characters: number };
  saveStateLabel: string;
  slug: string;
  tags: string[];
  desc: string;
  heroImage: string;
  imageCaption: string;
  authorImage: string;
  publishMode: NewsPublishMode;
  publishAt: string;
  openGraphTitle: string;
  openGraphDescription: string;
  openGraphImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  seoTitle: string;
  seoDescription: string;
  seoSource: 'manual' | 'auto' | null;
  seoNeedsReview: boolean;
  wordCount: number;
  editorHeadingCount: number;
  inlineHeadingCandidates: number;
  duplicateIntroDetected: boolean;
  isSubmitting: boolean;
  mediaBusy: boolean;
  onSlugChange: (value: string) => void;
  onTagChange: (value: string) => void;
  onTagsChange: (value: string[]) => void;
  onDescChange: (value: string) => void;
  onHeroImageChange: (value: string) => void;
  onImageCaptionChange: (value: string) => void;
  onAuthorNameChange: (value: string) => void;
  onAuthorImageChange: (value: string) => void;
  onPublishDateChange: (value: string) => void;
  onPublishModeChange: (value: NewsPublishMode) => void;
  onPublishAtChange: (value: string) => void;
  onOpenGraphTitleChange: (value: string) => void;
  onOpenGraphDescriptionChange: (value: string) => void;
  onOpenGraphImageChange: (value: string) => void;
  onTwitterTitleChange: (value: string) => void;
  onTwitterDescriptionChange: (value: string) => void;
  onTwitterImageChange: (value: string) => void;
  onSeoTitleChange: (value: string) => void;
  onSeoDescriptionChange: (value: string) => void;
  onGenerateSeo: () => void;
  onApplySeoPreview: () => void;
  onDiscardSeoPreview: () => void;
  seoPreviewOpen: boolean;
  seoPreviewTitle: string;
  seoPreviewDescription: string;
  onRunEditorialFixes: () => void;
};

export function DemoNewsEditorWorkspace(props: DemoNewsEditorWorkspaceProps) {
  return (
    <div className="grid w-full gap-6 px-3 py-6 lg:px-6 xl:px-8 xl:grid-cols-[minmax(0,1fr)_400px]">
      <section className={cn('min-w-0', !props.showSettings && 'xl:col-span-2')}>
        <Plate editor={props.editor} onChange={({ value }) => props.onContentChange(Array.isArray(value) ? value : [])}>
          <div className={cn('mx-auto w-full rounded-lg bg-background/80 px-5 py-6', props.editorFullWidth ? 'max-w-[1200px]' : 'max-w-[860px]')}>
            <textarea
              value={props.title}
              onChange={(event) => props.onTitleChange(event.target.value)}
              placeholder="Untitled article"
              rows={2}
              disabled={props.editorLockPage}
              style={{ fontFamily: 'var(--editor-font-family)' }}
              className="min-h-[78px] w-full resize-none border-none bg-transparent px-0 py-0 text-[30px] font-semibold leading-[1.2] tracking-tight shadow-none outline-none"
            />
            <div className="mt-3 mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-[rgb(130,135,145)]">
              <span>By {props.authorName}</span>
              <span aria-hidden="true">•</span>
              <span>{new Date(`${props.publishDate}T00:00:00`).toLocaleDateString('en-GB')}</span>
              <span aria-hidden="true">•</span>
              <span>{props.tag}</span>
            </div>
          </div>

          <NewsDocumentToolbar
            isMagicConfigured
            magicEnvVar="Demo only"
            onMagic={props.onOpenMagic}
            disabled={props.editorLockPage}
            onInsertImage={props.onInsertImage}
            onInsertVideo={props.onInsertVideo}
            onInsertFile={props.onInsertFile}
          />
          <NewsEditorFloatingToolbar onOpenMagic={props.onOpenMagic} onInsertComment={props.onInsertComment} />

          <div className={cn('relative mx-auto w-full pb-6', props.editorFullWidth ? 'max-w-[1320px]' : 'max-w-[980px]')}>
            <TocSidebar className={cn('top-[104px] hidden xl:block', props.showSettings ? 'right-[416px]' : 'right-2')} topOffset={24} />
            <div className="mt-4 rounded-lg border border-border/60 bg-background shadow-[0_18px_40px_-24px_rgba(0,0,0,0.55)]">
              <PlateContent
                placeholder="Type '/' for commands, or start writing your story..."
                onKeyDown={props.onEditorKeyDown}
                readOnly={props.editorLockPage}
                style={{ fontFamily: 'var(--editor-font-family)' }}
                className={cn('min-h-[72vh] py-10 outline-none', props.editorFullWidth ? 'px-10 md:px-14' : 'px-8 md:px-12', props.editorSmallText ? 'text-[14px] leading-[1.6]' : 'text-base leading-[1.75]', '**:data-slate-placeholder:text-muted-foreground/80 **:data-slate-placeholder:opacity-100!', 'selection:bg-primary/20', '[&_h1]:mt-[1.5em] [&_h1]:text-[30px] [&_h2]:mt-[1.75em] [&_h2]:text-[24px] [&_h3]:mt-[1.25em] [&_h3]:text-[20px] [&_p]:my-3 [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_img]:my-4 [&_img]:max-h-[460px] [&_img]:w-full [&_img]:rounded-lg [&_img]:border [&_img]:border-border [&_img]:object-cover [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-3 [&_th]:py-2')}
              />
            </div>
            <div className="sticky bottom-0 z-10 mt-3 flex items-center justify-between border-t border-border/80 bg-muted/30 px-3 py-2 text-xs text-muted-foreground opacity-70 backdrop-blur">
              <span className="flex items-center">
                <span>{props.stats.words} words</span>
                <span className="mx-2 text-border">|</span>
                <span>{props.stats.characters} characters</span>
                <span className="mx-2 text-border">|</span>
                <span>{props.editorSmallText ? 'Small text' : 'Normal text'}</span>
              </span>
              <span className="hidden md:inline">{props.saveStateLabel}</span>
            </div>
          </div>
        </Plate>
      </section>

      <aside className={cn('w-full shrink-0 xl:sticky xl:top-[88px] xl:h-[calc(100dvh-6rem)] xl:w-[400px]', props.showSettings && 'news-editor-panel-enter', !props.showSettings && 'hidden')}>
        <NewsEditorSettingsPanel
          slug={props.slug}
          title={props.title}
          tag={props.tag}
          tags={props.tags}
          desc={props.desc}
          heroImage={props.heroImage}
          imageCaption={props.imageCaption}
          authorName={props.authorName}
          authorImage={props.authorImage}
          publishDate={props.publishDate}
          publishMode={props.publishMode}
          publishAt={props.publishAt}
          openGraphTitle={props.openGraphTitle}
          openGraphDescription={props.openGraphDescription}
          openGraphImage={props.openGraphImage}
          twitterTitle={props.twitterTitle}
          twitterDescription={props.twitterDescription}
          twitterImage={props.twitterImage}
          seoTitle={props.seoTitle}
          seoDescription={props.seoDescription}
          seoSource={props.seoSource}
          seoNeedsReview={props.seoNeedsReview}
          seoProvider={{ configured: true, envVar: 'Demo only' }}
          seoPreviewOpen={props.seoPreviewOpen}
          seoPreviewTitle={props.seoPreviewTitle}
          seoPreviewDescription={props.seoPreviewDescription}
          summaryMaxLength={200}
          wordCount={props.wordCount}
          editorHeadingCount={props.editorHeadingCount}
          inlineHeadingCandidates={props.inlineHeadingCandidates}
          duplicateIntroDetected={props.duplicateIntroDetected}
          editorialFixDisabled={props.isSubmitting || props.mediaBusy}
          className="h-full"
          onSlugChange={props.onSlugChange}
          onTagChange={props.onTagChange}
          onTagsChange={props.onTagsChange}
          onDescChange={props.onDescChange}
          onHeroImageChange={props.onHeroImageChange}
          onImageCaptionChange={props.onImageCaptionChange}
          onAuthorNameChange={props.onAuthorNameChange}
          onAuthorImageChange={props.onAuthorImageChange}
          onPublishDateChange={props.onPublishDateChange}
          onPublishModeChange={props.onPublishModeChange}
          onPublishAtChange={props.onPublishAtChange}
          onOpenGraphTitleChange={props.onOpenGraphTitleChange}
          onOpenGraphDescriptionChange={props.onOpenGraphDescriptionChange}
          onOpenGraphImageChange={props.onOpenGraphImageChange}
          onTwitterTitleChange={props.onTwitterTitleChange}
          onTwitterDescriptionChange={props.onTwitterDescriptionChange}
          onTwitterImageChange={props.onTwitterImageChange}
          onSeoTitleChange={props.onSeoTitleChange}
          onSeoDescriptionChange={props.onSeoDescriptionChange}
          onGenerateSeo={props.onGenerateSeo}
          onApplySeoPreview={props.onApplySeoPreview}
          onDiscardSeoPreview={props.onDiscardSeoPreview}
          onRunEditorialFixes={props.onRunEditorialFixes}
        />
      </aside>
    </div>
  );
}
