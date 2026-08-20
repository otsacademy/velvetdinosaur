'use client'

import { insertCallout } from '@platejs/callout'
import { insertCodeBlock } from '@platejs/code-block'
import { insertDate } from '@platejs/date'
import { insertColumnGroup } from '@platejs/layout'
import { insertEquation, insertInlineEquation } from '@platejs/math'
import { insertTable } from '@platejs/table'
import { insertToc } from '@platejs/toc'
import { KEYS } from 'platejs'
import type { PlateEditor } from 'platejs/react'

import type { MediaPickerMode } from '@/components/edit/news-editor/news-editor-command-dialogs'

type RunNewsSlashCommandArgs = {
  command: string
  editor: PlateEditor
  openMediaPicker: (mode: MediaPickerMode) => Promise<void>
  insertVideoUrl: () => void
  insertCommentBlock: () => void
}

export async function runNewsSlashCommand({
  command,
  editor,
  openMediaPicker,
  insertVideoUrl,
  insertCommentBlock,
}: RunNewsSlashCommandArgs) {
  const focusEditor = () => editor.tf.focus()

  switch (command) {
    case 'insert-image': {
      await openMediaPicker('image')
      return
    }
    case 'insert-file': {
      await openMediaPicker('file')
      return
    }
    case 'insert-video': {
      insertVideoUrl()
      return
    }
    case 'insert-comment': {
      insertCommentBlock()
      return
    }
    case 'insert-callout': {
      insertCallout(editor, { select: true })
      focusEditor()
      return
    }
    case 'insert-code-block': {
      insertCodeBlock(editor, { select: true })
      focusEditor()
      return
    }
    case 'insert-date': {
      insertDate(editor, { select: true })
      focusEditor()
      return
    }
    case 'insert-equation': {
      insertEquation(editor, { select: true })
      focusEditor()
      return
    }
    case 'insert-inline-equation': {
      const input = window.prompt('Enter inline LaTeX expression', 'x^2')
      if (input === null) return
      const expression = input.trim() || 'x^2'
      insertInlineEquation(editor, expression, { select: true })
      focusEditor()
      return
    }
    case 'insert-toc': {
      insertToc(editor, { select: true })
      focusEditor()
      return
    }
    case 'insert-toggle': {
      editor.tf.insertNodes(
        {
          type: KEYS.toggle,
          children: [{ text: 'Toggle section title' }],
        } as never,
        { select: true },
      )
      focusEditor()
      return
    }
    case 'insert-columns-2': {
      insertColumnGroup(editor, { columns: 2, select: true })
      focusEditor()
      return
    }
    case 'insert-columns-3': {
      insertColumnGroup(editor, { columns: 3, select: true })
      focusEditor()
      return
    }
    case 'insert-mention': {
      editor.tf.insertText('@')
      focusEditor()
      return
    }
    case 'insert-emoji': {
      editor.tf.insertText(':')
      focusEditor()
      return
    }
    case 'insert-divider': {
      editor.tf.insertNodes({ type: KEYS.hr, children: [{ text: '' }] } as never)
      focusEditor()
      return
    }
    case 'insert-table': {
      insertTable(editor, { colCount: 3, rowCount: 3, header: true })
      focusEditor()
      return
    }
    default: {
      return
    }
  }
}
