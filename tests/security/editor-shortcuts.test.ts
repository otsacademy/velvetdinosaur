import { beforeAll, describe, expect, test } from 'bun:test';

// ASAP's September 2026 repair 10, "Editor HTML parsing", moves the news editor from Plate 52 to Plate 53. Plate 53's
// autoformat plugin does nothing any more, so the typing shortcuts now come from input rules on each feature
// (components/edit/news-editor/news-input-rules.ts). These tests type into the news editor's own plugin list, one
// character at a time as the keyboard does, and check that each shortcut still makes the same kind of block or mark.
// tests/visual/news-editor-html-safety.spec.ts checks the HTML cleaning in real browsers.

type Node = { type?: string; text?: string; children?: Node[]; [key: string]: unknown };
type TestEditor = {
  children: Node[];
  api: { end: (at: number[]) => unknown };
  tf: { select: (at: unknown) => void; insertText: (text: string) => void; insertBreak: () => void };
};

let typed: (keys: string) => Node[];

beforeAll(async () => {
  const { createPlateEditor } = await import('platejs/react');
  const { NEWS_EDITOR_PLUGINS } = await import('@/components/edit/news-editor/news-editor-plugins');
  typed = (keys) => {
    const editor = createPlateEditor({ plugins: NEWS_EDITOR_PLUGINS as never, value: [{ type: 'p', children: [{ text: '' }] }] }) as unknown as TestEditor;
    editor.tf.select(editor.api.end([]));
    for (const key of keys) {
      if (key === '\n') editor.tf.insertBreak();
      else editor.tf.insertText(key);
    }
    return editor.children;
  };
});

function findAll(nodes: Node[], match: (node: Node) => boolean): Node[] {
  return nodes.flatMap((node) => [...(match(node) ? [node] : []), ...findAll(node.children || [], match)]);
}
const textOf = (node: Node): string => node.text ?? (node.children || []).map(textOf).join('');

describe('news editor typing shortcuts', () => {
  for (const [keys, type] of [['# Title', 'h1'], ['## Title', 'h2'], ['### Title', 'h3'], ['> Title', 'blockquote']] as const) {
    test(`"${keys}" starts a ${type}`, () => {
      const [first] = typed(keys);
      expect(first.type).toBe(type);
      expect(textOf(first)).toBe('Title');
    });
  }

  for (const [keys, listStyleType] of [['- Item', 'disc'], ['* Item', 'disc'], ['1. Item', 'decimal'], ['1) Item', 'decimal']] as const) {
    test(`"${keys}" starts a ${listStyleType} list`, () => {
      const [first] = typed(keys);
      expect(first.listStyleType).toBe(listStyleType);
      expect(textOf(first)).toBe('Item');
    });
  }

  for (const [keys, mark] of [['**words**', 'bold'], ['*words*', 'italic'], ['__words__', 'underline'], ['~~words~~', 'strikethrough'], ['`words`', 'code']] as const) {
    test(`"${keys}" marks the words ${mark}`, () => {
      const [first] = typed(`Some ${keys} here`);
      expect(findAll([first], (node) => node[mark] === true).map(textOf)).toEqual(['words']);
      expect(textOf(first)).toBe('Some words here');
    });
  }

  test('"```" starts a code block, "+ " a toggle, "|||" two columns and "___ " a rule', () => {
    expect(findAll(typed('```'), (node) => node.type === 'code_block')).toHaveLength(1);
    expect(typed('+ Toggle')[0].type).toBe('toggle');
    expect(findAll(typed('|||'), (node) => node.type === 'column_group')).toHaveLength(1);
    // Plate 53 makes a rule from three underscores and a space; Plate 52 made one at the third underscore.
    expect(findAll(typed('___ '), (node) => node.type === 'hr')).toHaveLength(1);
  });

  test('quotes, arrows, symbols and fractions are still replaced as they are typed', () => {
    expect(textOf(typed('"Quoted" text -> (c) 1/2')[0])).toBe('“Quoted” text → © ½');
  });

  // Plate 52's rules all stayed off inside a code block. Plate 53's text substitutions still do; its heading, list and
  // mark rules do not (see docs/operations/security-catch-up-2026-11.md), so only the substitutions are checked here.
  test('quotes, arrows and symbols stay literal inside a code block', () => {
    const nodes = typed('```\na -> b (c) 1/2 "q"');
    expect(findAll(nodes, (node) => node.type === 'code_block')).toHaveLength(1);
    expect(JSON.stringify(nodes)).toContain('a -> b (c) 1/2 \\"q\\"');
  });
});
