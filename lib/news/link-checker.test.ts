import { afterEach, describe, expect, it } from 'bun:test'

import { checkNewsLinks } from '@/lib/news/link-checker'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('checkNewsLinks', () => {
  it('does not treat article text metadata or local asset images as broken links', async () => {
    const requestedUrls: string[] = []
    globalThis.fetch = (async (input) => {
      requestedUrls.push(String(input))
      return new Response('', { status: 200 })
    }) as typeof fetch

    const assetUrl =
      '/api/assets/file?key=uploads%2Fnews%2F2025-nelson-mandela-essay-prize-competition%2Fnelson-mandela.webp#focalX=0.5368&focalY=0'

    const result = await checkNewsLinks({
      title: '2026 Nelson Mandela Essay Prize Competition',
      desc: 'Inspiring African Leadership in Global Affairs CALL FOR SUBMISSIONS',
      img: assetUrl,
      socialImage: assetUrl,
      content: [
        {
          type: 'img',
          url: assetUrl,
          alt: '2026 Nelson Mandela Essay Prize Competition',
          children: [{ text: '' }],
        },
        {
          type: 'a',
          url: 'https://www.journalasap.org/index.php/asap/about/submissions',
          children: [{ text: 'Journal ASAP guidelines' }],
        },
        {
          type: 'a',
          url: 'mailto:mandelaprize@academicsstand.org',
          children: [{ text: 'mandelaprize@academicsstand.org' }],
        },
      ],
    })

    expect(result).toEqual({
      warnings: [],
      checkedInternal: 1,
      checkedExternal: 1,
    })
    expect(requestedUrls).toEqual(['https://www.journalasap.org/index.php/asap/about/submissions'])
  })
})
