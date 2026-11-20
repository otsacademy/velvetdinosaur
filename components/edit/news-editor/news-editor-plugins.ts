'use client'

import {
  BasicBlocksPlugin,
  BasicMarksPlugin,
  HighlightPlugin,
  HorizontalRulePlugin,
} from '@platejs/basic-nodes/react'
import { FontSizePlugin, TextAlignPlugin } from '@platejs/basic-styles/react'
import { CalloutPlugin } from '@platejs/callout/react'
import { CodeBlockPlugin, CodeLinePlugin, CodeSyntaxPlugin } from '@platejs/code-block/react'
import { DatePlugin } from '@platejs/date/react'
import { DndPlugin } from '@platejs/dnd'
import emojiMartData from '@emoji-mart/data'
import { EmojiInputPlugin, EmojiPlugin } from '@platejs/emoji/react'
import { IndentPlugin } from '@platejs/indent/react'
import { ColumnItemPlugin, ColumnPlugin } from '@platejs/layout/react'
import { LinkPlugin } from '@platejs/link/react'
import { ListPlugin } from '@platejs/list/react'
import { EquationPlugin, InlineEquationPlugin } from '@platejs/math/react'
import { FilePlugin, ImagePlugin, MediaEmbedPlugin } from '@platejs/media/react'
import { MentionInputPlugin, MentionPlugin } from '@platejs/mention/react'
import { BlockMenuPlugin, BlockSelectionPlugin } from '@platejs/selection/react'
import {
  TableCellHeaderPlugin,
  TableCellPlugin,
  TablePlugin,
  TableRowPlugin,
} from '@platejs/table/react'
import { TocPlugin } from '@platejs/toc/react'
import { TogglePlugin } from '@platejs/toggle/react'
import { KEYS, TrailingBlockPlugin } from 'platejs'
import { createElement } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

import { NewsEditorImageElement } from '@/components/edit/news-editor/news-editor-image-element'
import { BlockContextMenu } from '@/registry/ui/block-context-menu'
import { BlockDraggable } from '@/registry/ui/block-draggable'
import { ColumnElement, ColumnGroupElement } from '@/registry/ui/column-node'
import { EmojiInputElement } from '@/registry/ui/emoji-node'
import { MentionElement, MentionInputElement } from '@/registry/ui/mention-node'

const NEWS_BLOCK_SELECTION_PLUGIN = BlockSelectionPlugin.configure({
  options: {
    enableContextMenu: true,
  },
})

const NEWS_DND_PLUGIN = DndPlugin.configure({
  options: {
    enableScroller: true,
  },
  render: {
    aboveNodes: BlockDraggable,
    aboveSlate: ({ children }) =>
      createElement(DndProvider, { backend: HTML5Backend }, children),
  },
})

const NEWS_INDENT_PLUGIN = IndentPlugin.configure({
  inject: {
    targetPlugins: [
      ...KEYS.heading,
      KEYS.p,
      KEYS.blockquote,
      KEYS.codeBlock,
      KEYS.toggle,
      KEYS.img,
      KEYS.column,
    ],
  },
  options: {
    offset: 24,
  },
})

const NEWS_TEXT_ALIGN_PLUGIN = TextAlignPlugin.configure({
  inject: {
    targetPlugins: [
      ...KEYS.heading,
      KEYS.p,
      KEYS.blockquote,
      KEYS.codeBlock,
      KEYS.toggle,
    ],
  },
})

const NEWS_FONT_SIZE_PLUGIN = FontSizePlugin.configure({
  inject: {
    targetPlugins: [...KEYS.heading, KEYS.p, KEYS.blockquote],
  },
})

const NEWS_MENTION_PLUGIN = MentionPlugin.configure({
  options: {
    triggerPreviousCharPattern: /^$|^[\s"']$/,
  },
}).withComponent(MentionElement)

const NEWS_EMOJI_PLUGIN = EmojiPlugin.configure({
  options: {
    data: emojiMartData as never,
  },
})

import { NewsInputRulesPlugin } from './news-input-rules'
import { SafeHtmlPlugin } from './safe-html'

export const NEWS_EDITOR_PLUGINS = [
  SafeHtmlPlugin,
  NewsInputRulesPlugin,
  BasicBlocksPlugin,
  BasicMarksPlugin,
  NEWS_FONT_SIZE_PLUGIN,
  NEWS_TEXT_ALIGN_PLUGIN,
  CalloutPlugin,
  ColumnPlugin.withComponent(ColumnGroupElement),
  ColumnItemPlugin.withComponent(ColumnElement),
  CodeBlockPlugin,
  CodeLinePlugin,
  CodeSyntaxPlugin,
  DatePlugin,
  NEWS_EMOJI_PLUGIN,
  EmojiInputPlugin.withComponent(EmojiInputElement),
  HighlightPlugin,
  HorizontalRulePlugin,
  NEWS_INDENT_PLUGIN,
  EquationPlugin,
  InlineEquationPlugin,
  LinkPlugin,
  NEWS_MENTION_PLUGIN,
  MentionInputPlugin.withComponent(MentionInputElement),
  ImagePlugin.withComponent(NewsEditorImageElement),
  MediaEmbedPlugin,
  FilePlugin,
  ListPlugin,
  TablePlugin,
  TableRowPlugin,
  TableCellPlugin,
  TableCellHeaderPlugin,
  TocPlugin,
  TogglePlugin,
  NEWS_BLOCK_SELECTION_PLUGIN,
  BlockMenuPlugin.configure({
    render: {
      aboveSlate: BlockContextMenu,
    },
  }),
  NEWS_DND_PLUGIN,
  TrailingBlockPlugin,
]
