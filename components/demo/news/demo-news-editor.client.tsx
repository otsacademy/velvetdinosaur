'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { insertMediaEmbed } from '@platejs/media';
import { KEYS } from 'platejs';
import { usePlateEditor } from 'platejs/react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { DemoNewsEditorHeader } from '@/components/demo/news/demo-news-editor-header';
import { DemoNewsEditorDialogs } from '@/components/demo/news/demo-news-editor-dialogs';
import { DemoNewsEditorWorkspace } from '@/components/demo/news/demo-news-editor-workspace';
import { useDemoNewsMedia } from '@/components/demo/news/use-demo-news-media';
import {
  resetDemoNewsState,
  restoreDemoNewsHistoryItem,
  saveDemoNewsSnapshot,
  updateDemoNewsDraftPreview,
  clearDemoNewsState,
} from '@/components/demo/news/demo-news-storage';
import { NEWS_EDITOR_PLUGINS } from '@/components/edit/news-editor/news-document-toolbar';
import { NewsEditorCommandDialogs } from '@/components/edit/news-editor/news-editor-command-dialogs';
import { NewsEditorPreviewSheet, type NewsPreviewMode } from '@/components/edit/news-editor/news-editor-preview-sheet';
import { NewsEditorRightRail, type NewsEditorRightPanelKey } from '@/components/edit/news-editor/news-editor-right-rail';
import { type NewsPublishMode } from '@/components/edit/news-editor/news-editor-settings-panel';
import { runNewsSlashCommand } from '@/components/edit/news-editor/news-editor-slash-actions';
import { useNewsUnsavedChangesGuard } from '@/components/edit/news-editor/use-news-unsaved-changes-guard';
import {
  extractTextFromPlateNode,
  NEWS_MEDIA_FOLDER,
} from '@/components/edit/news-editor/news-editor-media-utils';
import { getCurrentEditorNodes, exportEditorDocument, importEditorDocumentFromFile } from '@/components/edit/news-editor/news-editor-import-export';
import { resetDemoEditorAssets } from '@/lib/demo-editor-assets';
import { createDemoNewsSeedDocument, type DemoNewsDocument, type DemoNewsHistoryItem } from '@/lib/demo-news-seed';
import { createArticleExcerpt } from '@/lib/news-presentation';
import { slugifyArticleTitle } from '@/lib/news-slug';
import { analyzePlateStructure } from '@/lib/news-plate-transform';
import { suggestImageCaption, suggestSummaryFromPlateContent, summaryLooksIncomplete, applyEditorialFixesToPlateContent } from '@/lib/news-editorial-fixes';
import { getNewsEditorFontFamilyStack, type NewsEditorFontFamily } from '@/lib/news-editor-document-settings';
import { londonDateTimeToUtc } from '@/lib/work/scheduling';
import { cn } from '@/lib/utils';

type DemoNewsEditorClientProps = {
  closeHref?: string;
  mainSiteHref?: string;
};

function cloneValue<T>(value: T): T {
  try {
    if (typeof structuredClone === 'function') {
      return structuredClone(value);
    }
  } catch {
    // Fall through.
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function snapshotHash(snapshot: DemoNewsDocument) {
  return JSON.stringify(snapshot);
}

export function DemoNewsEditorClient({
  closeHref = '/',
  mainSiteHref = '/',
}: DemoNewsEditorClientProps) {
  const seed = useMemo(() => createDemoNewsSeedDocument(), []);
  const [title, setTitle] = useState(seed.title);
  const [slug, setSlug] = useState(seed.slug);
  const [slugDirty, setSlugDirty] = useState(false);
  const [tag, setTag] = useState(seed.tag);
  const [tags, setTags] = useState<string[]>(seed.tags);
  const [desc, setDesc] = useState(seed.desc);
  const [heroImage, setHeroImage] = useState(seed.heroImage);
  const [imageCaption, setImageCaption] = useState(seed.imageCaption);
  const [authorName, setAuthorName] = useState(seed.authorName);
  const [authorImage, setAuthorImage] = useState(seed.authorImage);
  const [publishDate, setPublishDate] = useState(seed.publishDate);
  const [publishMode, setPublishMode] = useState<NewsPublishMode>('draft');
  const [publishAt, setPublishAt] = useState(seed.publishAt);
  const [openGraphTitle, setOpenGraphTitle] = useState(seed.openGraphTitle);
  const [openGraphDescription, setOpenGraphDescription] = useState(seed.openGraphDescription);
  const [openGraphImage, setOpenGraphImage] = useState(seed.openGraphImage);
  const [twitterTitle, setTwitterTitle] = useState(seed.twitterTitle);
  const [twitterDescription, setTwitterDescription] = useState(seed.twitterDescription);
  const [twitterImage, setTwitterImage] = useState(seed.twitterImage);
  const [seoTitle, setSeoTitle] = useState(seed.seoTitle);
  const [seoDescription, setSeoDescription] = useState(seed.seoDescription);
  const [seoSource, setSeoSource] = useState<'manual' | 'auto' | null>(seed.seoSource);
  const [seoNeedsReview, setSeoNeedsReview] = useState(seed.seoNeedsReview);
  const [seoPreviewOpen, setSeoPreviewOpen] = useState(false);
  const [seoPreviewTitle, setSeoPreviewTitle] = useState('');
  const [seoPreviewDescription, setSeoPreviewDescription] = useState('');
  const [content, setContent] = useState<unknown[]>(cloneValue(seed.content));
  const [showSettings, setShowSettings] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasLiveVersion, setHasLiveVersion] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<NewsPreviewMode>('draft');
  const [previewRefreshToken, setPreviewRefreshToken] = useState(0);
  const [rightRailPanel, setRightRailPanel] = useState<NewsEditorRightPanelKey | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<DemoNewsHistoryItem[]>([]);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleDialogValue, setScheduleDialogValue] = useState('');
  const [editorFontFamily, setEditorFontFamily] = useState<NewsEditorFontFamily>(seed.editorSettings.fontFamily);
  const [editorFullWidth, setEditorFullWidth] = useState(seed.editorSettings.fullWidth);
  const [editorSmallText, setEditorSmallText] = useState(seed.editorSettings.smallText);
  const [editorLockPage, setEditorLockPage] = useState(seed.editorSettings.lockPage);
  const [isImportingDocument, setIsImportingDocument] = useState(false);
  const [isExportingDocument, setIsExportingDocument] = useState(false);
  const [slashOpen, setSlashOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const documentImportInputRef = useRef<HTMLInputElement | null>(null);
  const baselineSnapshotRef = useRef<DemoNewsDocument>(cloneValue(seed));
  const baselineHashRef = useRef(snapshotHash(seed));

  const editor = usePlateEditor({ plugins: NEWS_EDITOR_PLUGINS, value: seed.content as never }, [seed.content]);
  const editorFontFamilyStack = useMemo(() => getNewsEditorFontFamilyStack(editorFontFamily), [editorFontFamily]);
  const previewSlug = useMemo(() => slugifyArticleTitle(slug || title), [slug, title]);
  const stats = useMemo(() => {
    const text = extractTextFromPlateNode(content).replace(/\s+/g, ' ').trim();
    return {
      words: text ? text.split(' ').length : 0,
      characters: text.length,
    };
  }, [content]);
  const contentStructure = useMemo(() => analyzePlateStructure(content), [content]);
  const createSnapshot = useCallback((): DemoNewsDocument => ({
    title,
    slug: slugifyArticleTitle(slug || title),
    tag,
    tags,
    desc,
    heroImage,
    imageCaption,
    authorName,
    authorImage,
    publishDate,
    publishAt,
    status: publishMode === 'publish' ? 'published' : publishMode === 'scheduled' ? 'scheduled' : 'draft',
    openGraphTitle,
    openGraphDescription,
    openGraphImage,
    twitterTitle,
    twitterDescription,
    twitterImage,
    seoTitle,
    seoDescription,
    seoSource,
    seoNeedsReview,
    editorSettings: {
      fontFamily: editorFontFamily,
      fullWidth: editorFullWidth,
      smallText: editorSmallText,
      lockPage: editorLockPage,
    },
    content: cloneValue(content),
  }), [
    authorImage,
    authorName,
    content,
    desc,
    editorFontFamily,
    editorFullWidth,
    editorLockPage,
    editorSmallText,
    heroImage,
    imageCaption,
    openGraphDescription,
    openGraphImage,
    openGraphTitle,
    publishAt,
    publishDate,
    publishMode,
    seoDescription,
    seoNeedsReview,
    seoSource,
    seoTitle,
    slug,
    tag,
    tags,
    title,
    twitterDescription,
    twitterImage,
    twitterTitle,
  ]);

  const replaceDocumentWithNodes = useCallback((nodes: unknown[]) => {
    const start = editor.api.start([] as never);
    const end = editor.api.end([] as never);
    if (!start || !end) return false;
    editor.tf.select({ anchor: start, focus: end } as never);
    editor.tf.delete();
    editor.tf.insertNodes((nodes.length ? nodes : [{ type: 'p', children: [{ text: '' }] }]) as never, { at: [0] as never });
    return true;
  }, [editor]);

  const applySnapshot = useCallback((snapshot: DemoNewsDocument) => {
    setTitle(snapshot.title);
    setSlug(snapshot.slug);
    setTag(snapshot.tag);
    setTags(snapshot.tags);
    setDesc(snapshot.desc);
    setHeroImage(snapshot.heroImage);
    setImageCaption(snapshot.imageCaption);
    setAuthorName(snapshot.authorName);
    setAuthorImage(snapshot.authorImage);
    setPublishDate(snapshot.publishDate);
    setPublishAt(snapshot.publishAt);
    setPublishMode(snapshot.status === 'published' ? 'publish' : snapshot.status === 'scheduled' ? 'scheduled' : 'draft');
    setOpenGraphTitle(snapshot.openGraphTitle);
    setOpenGraphDescription(snapshot.openGraphDescription);
    setOpenGraphImage(snapshot.openGraphImage);
    setTwitterTitle(snapshot.twitterTitle);
    setTwitterDescription(snapshot.twitterDescription);
    setTwitterImage(snapshot.twitterImage);
    setSeoTitle(snapshot.seoTitle);
    setSeoDescription(snapshot.seoDescription);
    setSeoSource(snapshot.seoSource);
    setSeoNeedsReview(snapshot.seoNeedsReview);
    setEditorFontFamily(snapshot.editorSettings.fontFamily);
    setEditorFullWidth(snapshot.editorSettings.fullWidth);
    setEditorSmallText(snapshot.editorSettings.smallText);
    setEditorLockPage(snapshot.editorSettings.lockPage);
    replaceDocumentWithNodes(cloneValue(snapshot.content));
    setContent(cloneValue(snapshot.content));
    setSlugDirty(true);
  }, [replaceDocumentWithNodes]);

  useEffect(() => {
    const next = resetDemoNewsState();
    baselineSnapshotRef.current = cloneValue(next.draft);
    baselineHashRef.current = snapshotHash(next.draft);
    setHistoryItems(next.history);
    setHasLiveVersion(Boolean(next.live));
    resetDemoEditorAssets();
    return () => {
      clearDemoNewsState();
      resetDemoEditorAssets();
    };
  }, []);

  useEffect(() => {
    if (slugDirty) return;
    setSlug(slugifyArticleTitle(title));
  }, [slugDirty, title]);

  const currentSnapshot = useMemo(() => createSnapshot(), [createSnapshot]);
  const isDirty = useMemo(() => snapshotHash(currentSnapshot) !== baselineHashRef.current, [currentSnapshot]);

  const {
    dialogOpen: leaveDialogOpen,
    setDialogOpen: setLeaveDialogOpen,
    confirmNavigation,
    cancelNavigation,
  } = useNewsUnsavedChangesGuard(isDirty);

  const saveStateMeta = useMemo(() => {
    if (isSubmitting) return { label: 'Saving demo draft…', toneClass: 'text-muted-foreground' };
    if (isDirty) return { label: 'Unsaved changes', toneClass: 'text-amber-600' };
    if (lastSavedAt) {
      return {
        label: `Last saved at ${lastSavedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`,
        toneClass: 'text-emerald-700',
      };
    }
    return { label: 'This sandbox resets on refresh', toneClass: 'text-muted-foreground' };
  }, [isDirty, isSubmitting, lastSavedAt]);

  const insertImageNode = useCallback((url: string, options?: { alt?: string; caption?: string }) => {
    editor.tf.insertNodes({ type: KEYS.img, url, alt: options?.alt, caption: options?.caption, children: [{ text: '' }] } as never, { select: true });
    editor.tf.focus();
  }, [editor]);

  const insertFileLinkNode = useCallback((url: string, name?: string) => {
    editor.tf.insertNodes({ type: KEYS.file, url, name: name || 'Attachment', children: [{ text: '' }] } as never, { select: true });
    editor.tf.focus();
  }, [editor]);
  const {
    mediaBusy,
    mediaPickerOpen,
    setMediaPickerOpen,
    mediaPickerMode,
    mediaQuery,
    setMediaQuery,
    mediaLoading,
    mediaList,
    loadMedia,
    openMediaPicker,
    onSelectMediaItem,
    onImageInputChange,
    onFileInputChange,
  } = useDemoNewsMedia({ insertImageNode, insertFileLinkNode });

  const persistSnapshot = useCallback(async (mode: NewsPublishMode, successMessage: string) => {
    const resolvedSlug = slugifyArticleTitle(slug || title);
    if (!resolvedSlug) return toast.error('A valid slug is required.');
    setIsSubmitting(true);
    try {
      const nextStatus: DemoNewsDocument['status'] =
        mode === 'publish' ? 'published' : mode === 'scheduled' ? 'scheduled' : 'draft';
      const nextSnapshot = cloneValue({
        ...currentSnapshot,
        slug: resolvedSlug,
        status: nextStatus,
        publishAt,
      }) as DemoNewsDocument;
      const nextState = saveDemoNewsSnapshot(nextSnapshot, nextSnapshot.status);
      baselineSnapshotRef.current = cloneValue(nextState.draft);
      baselineHashRef.current = snapshotHash(nextState.draft);
      setSlugDirty(true);
      setSlug(nextSnapshot.slug);
      setHistoryItems(nextState.history);
      setHasLiveVersion(Boolean(nextState.live));
      setLastSavedAt(new Date());
      toast.success(successMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [currentSnapshot, publishAt, slug, title]);

  const handlePreview = useCallback(() => {
    if (!previewSlug) return toast.error('A valid slug is required to preview.');
    updateDemoNewsDraftPreview(cloneValue({ ...currentSnapshot, slug: previewSlug }));
    if (!hasLiveVersion && previewMode === 'live') {
      setPreviewMode('draft');
    }
    setPreviewRefreshToken((current) => current + 1);
    setPreviewOpen(true);
  }, [currentSnapshot, hasLiveVersion, previewMode, previewSlug]);

  const handleRunEditorialFixes = useCallback(() => {
    const fixResult = applyEditorialFixesToPlateContent(content);
    if (fixResult.changed) {
      const nextNodes = cloneValue(fixResult.content) as unknown[];
      replaceDocumentWithNodes(nextNodes);
      setContent(nextNodes);
    }
    const nextSummary = suggestSummaryFromPlateContent(fixResult.content, 200);
    if ((!desc.trim() || summaryLooksIncomplete(desc)) && nextSummary) {
      setDesc(nextSummary);
    }
    if (heroImage.trim() && !imageCaption.trim()) {
      setImageCaption(suggestImageCaption(title));
    }
    toast.success(fixResult.changed ? 'Editorial quick fixes applied in the demo.' : 'No quick fixes were needed.');
  }, [content, desc, heroImage, imageCaption, replaceDocumentWithNodes, title]);

  const runSlashCommand = useCallback(async (command: string) => {
    if (editorLockPage) return;
    setSlashOpen(false);
    await runNewsSlashCommand({
      command,
      editor,
      imageInputRef,
      fileInputRef,
      openMediaPicker,
      insertVideoUrl: () => {
        const url = window.prompt('Paste a video URL', 'https://')?.trim();
        if (!url) return;
        insertMediaEmbed(editor, { url });
      },
      insertCommentBlock: () => {
        editor.tf.insertNodes({ type: KEYS.blockquote, children: [{ type: KEYS.p, children: [{ text: 'Comment: ' }] }] } as never, { select: true });
      },
    });
  }, [editor, editorLockPage, openMediaPicker]);

  const handleGenerateSeo = useCallback(() => {
    const summarySeed = createArticleExcerpt(desc || suggestSummaryFromPlateContent(content, 160), { maxChars: 160, preferSentence: true });
    setSeoPreviewTitle(createArticleExcerpt(title, { maxChars: 60, preferSentence: false }));
    setSeoPreviewDescription(summarySeed);
    setSeoPreviewOpen(true);
    toast.success('SEO preview generated for the demo.');
  }, [content, desc, title]);

  const handleExportDocument = useCallback(async (format: 'docx' | 'pdf' | 'md' | 'html') => {
    setIsExportingDocument(true);
    try {
      const nodes = getCurrentEditorNodes(editor, content) as unknown[];
      const result = await exportEditorDocument(editor, nodes, format, title);
      const objectUrl = window.URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = result.fileName;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 2_000);
      toast.success(`Exported ${result.fileName}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed.');
    } finally {
      setIsExportingDocument(false);
    }
  }, [content, editor, title]);

  const handleEditorKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      setSlashOpen(true);
      return;
    }
    if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
    const selection = window.getSelection();
    const prefix = (selection?.anchorNode?.textContent || '').slice(0, selection?.anchorOffset || 0);
    if ((selection?.isCollapsed ?? false) && (prefix.trim().length === 0 || /\s$/.test(prefix))) {
      event.preventDefault();
      setSlashOpen(true);
    }
  }, []);

  return (
    <main className="news-article-editor min-h-screen bg-muted/20" style={{ '--editor-font-family': editorFontFamilyStack } as React.CSSProperties}>
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={onImageInputChange} />
      <input ref={fileInputRef} type="file" className="hidden" onChange={onFileInputChange} />
      <input ref={documentImportInputRef} type="file" accept=".docx,.md,.markdown,.html,.htm,text/markdown,text/html,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={(event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        void (async () => {
          setIsImportingDocument(true);
          try {
            const imported = await importEditorDocumentFromFile(editor, file);
            replaceDocumentWithNodes(cloneValue(imported) as unknown[]);
            setContent(cloneValue(imported) as unknown[]);
            toast.success(`Imported ${file.name}`);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Import failed.');
          } finally {
            setIsImportingDocument(false);
          }
        })();
      }} />

      <DemoNewsEditorHeader
        title={title}
        subtitle="Sandbox article editor"
        returnHref={closeHref}
        mainSiteHref={mainSiteHref}
        saveStateMeta={saveStateMeta}
        isSubmitting={isSubmitting}
        mediaBusy={mediaBusy}
        isImportingDocument={isImportingDocument}
        isExportingDocument={isExportingDocument}
        showSettings={showSettings}
        editorFullWidth={editorFullWidth}
        editorSmallText={editorSmallText}
        editorLockPage={editorLockPage}
        isDirty={isDirty}
        editorFontFamily={editorFontFamily}
        onPreview={handlePreview}
        onSaveChanges={() => void persistSnapshot(publishMode, 'Changes saved inside the demo only.')}
        onSaveDraft={() => void persistSnapshot('draft', 'Draft saved inside the demo only.')}
        onPublishNow={() => void persistSnapshot('publish', 'This article is published only inside the sandbox demo.')}
        onSchedule={() => {
          if (!londonDateTimeToUtc(publishAt)) {
            setScheduleDialogValue(publishAt);
            setScheduleDialogOpen(true);
            return;
          }
          void persistSnapshot('scheduled', 'Publication scheduled inside the demo only.');
        }}
        onOpenHistory={() => setHistoryOpen(true)}
        onImport={() => documentImportInputRef.current?.click()}
        onExport={(format) => void handleExportDocument(format)}
        onToggleSettings={setShowSettings}
        onToggleFullWidth={setEditorFullWidth}
        onToggleSmallText={setEditorSmallText}
        onToggleLockPage={setEditorLockPage}
        onFontFamilyChange={(value) => setEditorFontFamily(value)}
        onResetDraftEdits={() => {
          applySnapshot(cloneValue(baselineSnapshotRef.current));
          toast.success('Changes reset to the last saved demo state.');
        }}
      />

      <DemoNewsEditorWorkspace
        editor={editor}
        content={content}
        onContentChange={setContent}
        showSettings={showSettings}
        editorFullWidth={editorFullWidth}
        editorSmallText={editorSmallText}
        editorLockPage={editorLockPage}
        title={title}
        authorName={authorName}
        publishDate={publishDate}
        tag={tag}
        onTitleChange={setTitle}
        onEditorKeyDown={handleEditorKeyDown}
        onInsertImage={() => imageInputRef.current?.click()}
        onInsertVideo={() => {
          const url = window.prompt('Paste a video URL', 'https://')?.trim();
          if (!url) return;
          insertMediaEmbed(editor, { url });
        }}
        onInsertFile={() => fileInputRef.current?.click()}
        onOpenMagic={() => toast.info('AI rewriting is switched off in this demo.')}
        onInsertComment={() => editor.tf.insertNodes({ type: KEYS.blockquote, children: [{ type: KEYS.p, children: [{ text: 'Comment: ' }] }] } as never, { select: true })}
        stats={stats}
        saveStateLabel={saveStateMeta.label}
        slug={slug}
        tags={tags}
        desc={desc}
        heroImage={heroImage}
        imageCaption={imageCaption}
        authorImage={authorImage}
        publishMode={publishMode}
        publishAt={publishAt}
        openGraphTitle={openGraphTitle}
        openGraphDescription={openGraphDescription}
        openGraphImage={openGraphImage}
        twitterTitle={twitterTitle}
        twitterDescription={twitterDescription}
        twitterImage={twitterImage}
        seoTitle={seoTitle}
        seoDescription={seoDescription}
        seoSource={seoSource}
        seoNeedsReview={seoNeedsReview}
        wordCount={stats.words}
        editorHeadingCount={contentStructure.headingCount}
        inlineHeadingCandidates={contentStructure.inlineHeadingCandidates}
        duplicateIntroDetected={contentStructure.duplicateOpeningParagraph}
        isSubmitting={isSubmitting}
        mediaBusy={mediaBusy}
        onSlugChange={(value) => { setSlugDirty(true); setSlug(value); }}
        onTagChange={setTag}
        onTagsChange={setTags}
        onDescChange={(value) => setDesc(value.slice(0, 200))}
        onHeroImageChange={setHeroImage}
        onImageCaptionChange={setImageCaption}
        onAuthorNameChange={setAuthorName}
        onAuthorImageChange={setAuthorImage}
        onPublishDateChange={setPublishDate}
        onPublishModeChange={setPublishMode}
        onPublishAtChange={(value) => { setPublishAt(value); setPublishMode('scheduled'); }}
        onOpenGraphTitleChange={setOpenGraphTitle}
        onOpenGraphDescriptionChange={setOpenGraphDescription}
        onOpenGraphImageChange={setOpenGraphImage}
        onTwitterTitleChange={setTwitterTitle}
        onTwitterDescriptionChange={setTwitterDescription}
        onTwitterImageChange={setTwitterImage}
        onSeoTitleChange={(value) => { setSeoTitle(value); setSeoSource('manual'); setSeoNeedsReview(false); }}
        onSeoDescriptionChange={(value) => { setSeoDescription(value); setSeoSource('manual'); setSeoNeedsReview(false); }}
        onGenerateSeo={handleGenerateSeo}
        onApplySeoPreview={() => {
          setSeoTitle(seoPreviewTitle);
          setSeoDescription(seoPreviewDescription);
          setSeoSource('auto');
          setSeoNeedsReview(false);
          setSeoPreviewOpen(false);
          toast.success('SEO fields applied inside the demo.');
        }}
        onDiscardSeoPreview={() => setSeoPreviewOpen(false)}
        seoPreviewOpen={seoPreviewOpen}
        seoPreviewTitle={seoPreviewTitle}
        seoPreviewDescription={seoPreviewDescription}
        onRunEditorialFixes={handleRunEditorialFixes}
      />

      <NewsEditorRightRail activePanel={rightRailPanel} onTogglePanel={(panel) => setRightRailPanel((current) => current === panel ? null : panel)} onOpenVersionHistory={() => setHistoryOpen(true)} historyItemCount={historyItems.length} saveStateLabel={saveStateMeta.label} settingsOpen={showSettings} className={cn(showSettings && 'xl:hidden')} />
      <NewsEditorPreviewSheet open={previewOpen} onOpenChange={setPreviewOpen} slug={previewSlug || null} previewMode={previewMode} onPreviewModeChange={setPreviewMode} canViewLive={hasLiveVersion} refreshToken={previewRefreshToken} onRefresh={() => setPreviewRefreshToken((current) => current + 1)} />
      <NewsEditorCommandDialogs slashOpen={slashOpen} onSlashOpenChange={setSlashOpen} onRunSlashCommand={(command) => void runSlashCommand(command)} mediaPickerOpen={mediaPickerOpen} onMediaPickerOpenChange={setMediaPickerOpen} mediaPickerMode={mediaPickerMode} mediaFolder={NEWS_MEDIA_FOLDER} mediaQuery={mediaQuery} onMediaQueryChange={setMediaQuery} mediaLoading={mediaLoading} mediaList={mediaList} onRefreshMedia={() => void loadMedia()} onSelectMediaItem={onSelectMediaItem} formatAssetLabel={(item) => item.name || item.caption || item.key} />

      <DemoNewsEditorDialogs
        scheduleDialogOpen={scheduleDialogOpen}
        scheduleDialogValue={scheduleDialogValue}
        onScheduleDialogOpenChange={setScheduleDialogOpen}
        onScheduleDialogValueChange={setScheduleDialogValue}
        onScheduleConfirm={() => {
          if (!londonDateTimeToUtc(scheduleDialogValue)) {
            return toast.error('Enter a valid scheduled time.');
          }
          setPublishAt(scheduleDialogValue);
          setScheduleDialogOpen(false);
          void persistSnapshot('scheduled', 'Publication scheduled inside the demo only.');
        }}
        historyOpen={historyOpen}
        historyItems={historyItems}
        onHistoryOpenChange={setHistoryOpen}
        onRestoreHistoryItem={(id) => {
          const nextState = restoreDemoNewsHistoryItem(id);
          setHistoryItems(nextState.history);
          baselineSnapshotRef.current = cloneValue(nextState.draft);
          baselineHashRef.current = snapshotHash(nextState.draft);
          applySnapshot(nextState.draft);
          setLastSavedAt(new Date());
          toast.success('Demo version restored.');
        }}
        leaveDialogOpen={leaveDialogOpen}
        onLeaveDialogOpenChange={setLeaveDialogOpen}
        onCancelLeave={cancelNavigation}
        onConfirmLeave={confirmNavigation}
      />
    </main>
  );
}
