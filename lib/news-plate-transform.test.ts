import { describe, expect, test } from 'bun:test'
import { extractPlainTextFromPlate, plateToArticleSections } from './news-plate-transform'

// Plate 53 stores two things differently from Plate 52. A quotation holds one paragraph per line, where Plate 52 kept
// one text with line breaks; and a rule typed as `---` keeps the "—" that `--` became inside it, where Plate 52's rule
// was empty. What visitors read (the article sections, and the plain text that summaries, reading times and search
// descriptions come from) must stay as it was for the same content on Plate 52.

type Node = { type?: string; text?: string; children?: Node[]; [key: string]: unknown }

const text = (value: string): Node => ({ text: value })
const p = (...children: Node[]): Node => ({ type: 'p', children })
const quote = (...children: Node[]): Node => ({ type: 'blockquote', children })
const link = (value: string): Node => ({ type: 'a', url: 'https://example.com/guide', children: [text(value)] })
const rule = (value: string): Node => ({ type: 'hr', children: [text(value)] })

describe('quotations', () => {
  test('a Plate 53 quotation of two paragraphs reads with a space between them', () => {
    const [section] = plateToArticleSections([quote(p(text('Quote')), p(text('Next line')))])
    expect(section.quote).toBe('Quote Next line')
  })

  test('a link inside a paragraph inside a quotation still joins its sentence', () => {
    const [section] = plateToArticleSections([
      quote(p(text('Read '), link('our guide'), text('.')), p(text('Next line'))),
    ])
    expect(section.quote).toBe('Read our guide. Next line')
  })

  test('a Plate 52 quotation, one text with a line break or a link inside, reads as before', () => {
    expect(plateToArticleSections([quote(text('Quote\nNext line'))])[0].quote).toBe('Quote Next line')
    expect(plateToArticleSections([quote(text('Read '), link('our guide'), text('.'))])[0].quote).toBe('Read our guide.')
  })

  test('a second quotation in a section, kept as a paragraph, reads the same way', () => {
    const [section] = plateToArticleSections([quote(p(text('First'))), quote(p(text('Quote')), p(text('Next line')))])
    expect(section.quote).toBe('First')
    expect(section.paragraphs).toEqual(['Quote Next line'])
  })

  test('the plain text reads a Plate 53 quotation as it read the Plate 52 one', () => {
    const before = extractPlainTextFromPlate([p(text('Intro')), quote(text('Quote\nNext line'))])
    expect(before).toBe('Intro\nQuote Next line')
    expect(extractPlainTextFromPlate([p(text('Intro')), quote(p(text('Quote')), p(text('Next line')))])).toBe(before)
  })
})

describe('horizontal rules', () => {
  test('a rule adds no text, even with the "—" Plate 53 keeps in it', () => {
    const value = [p(text('Above the rule')), rule('—'), p(text('Below the rule'))]
    expect(plateToArticleSections(value)[0].paragraphs).toEqual(['Above the rule', 'Below the rule'])
    expect(extractPlainTextFromPlate(value)).toBe('Above the rule\nBelow the rule')
  })

  test('an article that is only a rule reads as the empty Plate 52 rule did', () => {
    expect(plateToArticleSections([rule('—')])).toEqual(plateToArticleSections([rule('')]))
    expect(extractPlainTextFromPlate([rule('—')])).toBe('')
  })
})
