'use client'

import { BlockquoteRules, BoldRules, CodeRules, HeadingRules, HorizontalRuleRules, ItalicRules, MarkComboRules, StrikethroughRules, SubscriptRules, SuperscriptRules, UnderlineRules } from '@platejs/basic-nodes'
import { CodeBlockRules } from '@platejs/code-block'
import { BulletedListRules, OrderedListRules, TaskListRules } from '@platejs/list'
import { insertColumnGroup } from '@platejs/layout'
import { openNextToggles } from '@platejs/toggle/react'
import { createBlockStartInputRule, createTextSubstitutionInputRule, KEYS } from 'platejs'
import { createPlatePlugin } from 'platejs/react'
import { NEWS_TEXT_SUBSTITUTIONS } from './news-text-substitutions'

// Plate 53 replaces the inert AutoformatPlugin with rules on the owning feature.
// Stored nodes and serialization stay unchanged.
export const NewsInputRulesPlugin = createPlatePlugin({
  key: 'news-input-rules',
  override: { plugins: {
    ...Object.fromEntries(KEYS.heading.map((key) => [key, { inputRules: [HeadingRules.markdown()] }])),
    [KEYS.blockquote]: { inputRules: [BlockquoteRules.markdown()] },
    [KEYS.hr]: { inputRules: [HorizontalRuleRules.markdown(), HorizontalRuleRules.markdown({ variant: '_' })] },
    [KEYS.bold]: { inputRules: [BoldRules.markdown(), ...(['boldItalic', 'boldUnderline', 'italicUnderline', 'boldItalicUnderline'] as const).map((variant) => MarkComboRules.markdown({ variant }))] },
    [KEYS.italic]: { inputRules: [ItalicRules.markdown(), ItalicRules.markdown({ variant: '_' })] },
    [KEYS.underline]: { inputRules: [UnderlineRules.markdown()] },
    [KEYS.code]: { inputRules: [CodeRules.markdown()] },
    [KEYS.strikethrough]: { inputRules: [StrikethroughRules.markdown()] },
    [KEYS.sub]: { inputRules: [SubscriptRules.markdown()] },
    [KEYS.sup]: { inputRules: [SuperscriptRules.markdown()] },
    [KEYS.codeBlock]: { inputRules: [CodeBlockRules.markdown({ on: 'match' })] },
    [KEYS.list]: { inputRules: [BulletedListRules.markdown(), BulletedListRules.markdown({ variant: '*' }), OrderedListRules.markdown(), OrderedListRules.markdown({ variant: ')' }), TaskListRules.markdown(), TaskListRules.markdown({ checked: true })] },
    [KEYS.toggle]: { inputRules: [createBlockStartInputRule({ trigger: ' ', match: '+', apply: ({ editor }, match) => {
      editor.tf.delete({ at: match.range }); openNextToggles(editor); editor.tf.setNodes({ type: KEYS.toggle }); return true
    } })] },
    [KEYS.column]: { inputRules: [createBlockStartInputRule({ trigger: '|', match: '||', apply: ({ editor }, match) => {
      editor.tf.delete({ at: match.range }); insertColumnGroup(editor, { columns: 2, select: true }); return true
    } })] },
  } },
  inputRules: [createTextSubstitutionInputRule({ enabled: ({ editor }) => !editor.api.some({ match: { type: KEYS.codeBlock } }), patterns: NEWS_TEXT_SUBSTITUTIONS })],
})
