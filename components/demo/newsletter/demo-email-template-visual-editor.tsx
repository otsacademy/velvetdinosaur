'use client';

import {
  BasicBlocksPlugin,
  BasicMarksPlugin,
  BlockquotePlugin,
  H2Plugin,
  H3Plugin
} from '@platejs/basic-nodes/react';
import { unwrapLink, upsertLink } from '@platejs/link';
import { LinkPlugin, useLinkToolbarButton, useLinkToolbarButtonState } from '@platejs/link/react';
import { toggleList } from '@platejs/list';
import { ListPlugin } from '@platejs/list/react';
import { KEYS, TrailingBlockPlugin, type Value } from 'platejs';
import {
  Plate,
  PlateContent,
  useEditorRef,
  useEditorSelector,
  useMarkToolbarButton,
  useMarkToolbarButtonState,
  usePlateEditor
} from 'platejs/react';
import { Bold, Braces, Heading2, Heading3, Link2, List, ListOrdered, Pilcrow, Quote, Redo, Undo } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ensureVisualValue, type DemoEmailTemplateVisualNode } from '@/lib/demo-email-template-visual';

const EMAIL_TEMPLATE_VISUAL_PLUGINS = [
  BasicBlocksPlugin,
  BasicMarksPlugin,
  LinkPlugin,
  ListPlugin,
  TrailingBlockPlugin
];

const toolbarButtonClass =
  'inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-[var(--vd-border)] bg-[var(--vd-card)] px-2 text-[var(--vd-muted-fg)] transition hover:bg-[var(--vd-muted)] hover:text-[var(--vd-fg)] data-[state=on]:border-[var(--vd-ring)] data-[state=on]:text-[var(--vd-fg)] disabled:cursor-not-allowed disabled:opacity-50';

type ToolbarButtonProps = {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
};

type MarkButtonProps = {
  nodeType: string;
  label: string;
  disabled?: boolean;
  children: ReactNode;
};

type LinkButtonProps = {
  disabled?: boolean;
};

type DemoEmailTemplateVisualEditorProps = {
  editorKey: number;
  initialValue: DemoEmailTemplateVisualNode[];
  tokens: string[];
  insertTokenRequest?: { token: string; nonce: number } | null;
  disabled?: boolean;
  onChange: (value: DemoEmailTemplateVisualNode[]) => void;
};

type DemoEmailTemplateVisualEditorBodyProps = {
  tokens: string[];
  insertTokenRequest?: { token: string; nonce: number } | null;
  disabled: boolean;
};

function ToolbarButton({ label, active = false, disabled = false, onClick, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className={toolbarButtonClass}
      data-state={active ? 'on' : 'off'}
      title={label}
      aria-label={label}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function MarkButton({ nodeType, label, disabled = false, children }: MarkButtonProps) {
  const editor = useEditorRef();
  const state = useMarkToolbarButtonState({ nodeType });
  const { props } = useMarkToolbarButton(state);
  const active = Boolean((props as { pressed?: boolean }).pressed);

  return (
    <button
      type="button"
      className={toolbarButtonClass}
      data-state={active ? 'on' : 'off'}
      title={label}
      aria-label={label}
      disabled={disabled}
      onMouseDown={(event) => {
        event.preventDefault();
        props.onMouseDown?.(event as never);
      }}
      onClick={() => {
        props.onClick?.();
        editor.tf.focus();
      }}
    >
      {children}
    </button>
  );
}

function LinkButton({ disabled = false }: LinkButtonProps) {
  const editor = useEditorRef();
  const state = useLinkToolbarButtonState();
  const { props } = useLinkToolbarButton(state);
  const active = Boolean((props as { pressed?: boolean }).pressed);

  return (
    <button
      type="button"
      className={toolbarButtonClass}
      data-state={active ? 'on' : 'off'}
      title={active ? 'Remove link' : 'Insert link'}
      aria-label={active ? 'Remove link' : 'Insert link'}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => {
        if (active) {
          unwrapLink(editor, { split: true });
          editor.tf.focus();
          return;
        }

        const initial = 'https://';
        const raw = window.prompt('Enter link URL', initial);
        if (!raw) return;
        const url = raw.trim();
        if (!url) return;

        upsertLink(editor, {
          url,
          text: url,
          target: '_blank'
        });
        editor.tf.focus();
      }}
    >
      <Link2 className="h-4 w-4" />
    </button>
  );
}

function DemoEmailTemplateVisualEditorBody({
  tokens,
  insertTokenRequest,
  disabled
}: DemoEmailTemplateVisualEditorBodyProps) {
  const editor = useEditorRef();

  useEffect(() => {
    if (!insertTokenRequest?.token) return;
    editor.tf.insertText(insertTokenRequest.token);
    editor.tf.focus();
  }, [editor, insertTokenRequest?.nonce, insertTokenRequest?.token]);

  const activeBlock = useEditorSelector((currentEditor) => {
    if (currentEditor.api.some({ match: (node) => (node as { type?: string }).type === KEYS.h2 })) return KEYS.h2;
    if (currentEditor.api.some({ match: (node) => (node as { type?: string }).type === KEYS.h3 })) return KEYS.h3;
    if (currentEditor.api.some({ match: (node) => (node as { type?: string }).type === KEYS.blockquote })) return KEYS.blockquote;
    return KEYS.p;
  }, []);

  const isBulletList = useEditorSelector(
    (currentEditor) =>
      currentEditor.api.some({ match: (node) => (node as { listStyleType?: string }).listStyleType === KEYS.ul }),
    []
  );
  const isNumberedList = useEditorSelector(
    (currentEditor) =>
      currentEditor.api.some({ match: (node) => (node as { listStyleType?: string }).listStyleType === KEYS.ol }),
    []
  );

  return (
    <div className={cn('space-y-3', disabled && 'pointer-events-none opacity-70')}>
      <div className="flex flex-wrap items-center gap-2 rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-muted)]/20 p-2">
        <div className="flex items-center gap-1">
          <ToolbarButton label="Undo" disabled={disabled} onClick={() => { editor.tf.undo(); editor.tf.focus(); }}>
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Redo" disabled={disabled} onClick={() => { editor.tf.redo(); editor.tf.focus(); }}>
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="h-5 w-px bg-[var(--vd-border)]" />

        <div className="flex items-center gap-1">
          <ToolbarButton label="Paragraph" active={activeBlock === KEYS.p} disabled={disabled} onClick={() => { editor.tf.setNodes({ type: KEYS.p }); editor.tf.focus(); }}>
            <Pilcrow className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Heading 2" active={activeBlock === KEYS.h2} disabled={disabled} onClick={() => { ((editor.getApi(H2Plugin) as { h2?: { toggle?: () => void } }).h2?.toggle ?? (() => undefined))(); editor.tf.focus(); }}>
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Heading 3" active={activeBlock === KEYS.h3} disabled={disabled} onClick={() => { ((editor.getApi(H3Plugin) as { h3?: { toggle?: () => void } }).h3?.toggle ?? (() => undefined))(); editor.tf.focus(); }}>
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Quote" active={activeBlock === KEYS.blockquote} disabled={disabled} onClick={() => { ((editor.getApi(BlockquotePlugin) as { blockquote?: { toggle?: () => void } }).blockquote?.toggle ?? (() => undefined))(); editor.tf.focus(); }}>
            <Quote className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="h-5 w-px bg-[var(--vd-border)]" />

        <div className="flex items-center gap-1">
          <MarkButton nodeType="bold" label="Bold" disabled={disabled}>
            <Bold className="h-4 w-4" />
          </MarkButton>
          <MarkButton nodeType="italic" label="Italic" disabled={disabled}>
            <span className="text-sm font-semibold italic">I</span>
          </MarkButton>
          <MarkButton nodeType="underline" label="Underline" disabled={disabled}>
            <span className="text-sm font-semibold underline">U</span>
          </MarkButton>
          <LinkButton disabled={disabled} />
        </div>

        <div className="h-5 w-px bg-[var(--vd-border)]" />

        <div className="flex items-center gap-1">
          <ToolbarButton label="Bullet list" active={isBulletList} disabled={disabled} onClick={() => { toggleList(editor, { listStyleType: KEYS.ul }); editor.tf.focus(); }}>
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Numbered list" active={isNumberedList} disabled={disabled} onClick={() => { toggleList(editor, { listStyleType: KEYS.ol }); editor.tf.focus(); }}>
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="h-5 w-px bg-[var(--vd-border)]" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm" disabled={disabled}>
              <Braces className="h-4 w-4" />
              Insert token
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-[260px] overflow-auto">
            {tokens.map((token) => (
              <DropdownMenuItem
                key={token}
                onSelect={(event) => {
                  event.preventDefault();
                  editor.tf.insertText(token);
                  editor.tf.focus();
                }}
              >
                <span className="font-mono text-xs">{token}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="overflow-hidden rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)]">
        <PlateContent
          readOnly={disabled}
          placeholder="Write email content here..."
          className={cn(
            'min-h-[360px] p-4 outline-none',
            '**:data-slate-placeholder:text-[var(--vd-muted-fg)]/80 **:data-slate-placeholder:opacity-100!',
            '[&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-semibold',
            '[&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold',
            '[&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold',
            '[&_p]:mb-3 [&_p]:text-[15px] [&_p]:leading-7',
            '[&_blockquote]:mb-3 [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--vd-border)] [&_blockquote]:pl-4 [&_blockquote]:italic',
            '[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6',
            '[&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6',
            '[&_a]:text-[var(--vd-primary)] [&_a]:underline [&_a]:underline-offset-2'
          )}
        />
      </div>
    </div>
  );
}

export function DemoEmailTemplateVisualEditor({
  editorKey,
  initialValue,
  tokens,
  insertTokenRequest,
  disabled = false,
  onChange
}: DemoEmailTemplateVisualEditorProps) {
  const editor = usePlateEditor(
    {
      plugins: EMAIL_TEMPLATE_VISUAL_PLUGINS,
      value: ensureVisualValue(initialValue) as unknown as Value
    },
    [editorKey]
  );

  return (
    <Plate
      editor={editor}
      onChange={({ value }) => {
        onChange(ensureVisualValue(value));
      }}
    >
      <DemoEmailTemplateVisualEditorBody tokens={tokens} insertTokenRequest={insertTokenRequest} disabled={disabled} />
    </Plate>
  );
}
