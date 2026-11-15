import { Fragment, type ReactNode } from "react"

import Link from "next/link"

import { DesignShell } from "@/components/home/design-shell"
import { BTN_LG, HOME_BTN_PRIMARY, HOME_CONTAINER, PageIntro } from "@/components/home/home-shared"
import { LEGAL_IDENTITY_PARAGRAPH } from "@/lib/legal-identity"
import type { LegalPageContent } from "@/lib/legal-pages-content"

// Renders the plain-text section bodies migrated from the CMS: blank-line
// separated paragraphs, with consecutive "• " lines grouped into lists.
function renderBody(body: string): ReactNode {
  const blocks: ReactNode[] = []
  let listItems: string[] = []
  let key = 0

  const flushList = () => {
    if (!listItems.length) return
    const items = listItems
    listItems = []
    blocks.push(
      <ul key={key++} className="m-0 flex list-none flex-col gap-2 p-0">
        {items.map((item) => (
          <li key={item} className="flex items-baseline gap-2.5">
            <span aria-hidden className="text-accent">
              •
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>,
    )
  }

  for (const rawLine of body.replace("{{IDENTITY}}", LEGAL_IDENTITY_PARAGRAPH).split("\n")) {
    const line = rawLine.trim()
    if (line.startsWith("• ")) {
      listItems.push(line.slice(2).trim())
      continue
    }
    flushList()
    if (line) {
      blocks.push(
        <p key={key++} className="m-0">
          {line}
        </p>,
      )
    }
  }
  flushList()
  return <>{blocks}</>
}

export function LegalPage({ content }: { content: LegalPageContent }) {
  return (
    <DesignShell>
      <PageIntro kicker={content.badgeLabel} title={content.title}>
        {content.description || null}
      </PageIntro>
      <div className={`${HOME_CONTAINER} pb-20 pt-12 sm:pb-[104px] sm:pt-14`}>
        <div className="flex max-w-[720px] flex-col gap-10 border-t border-border pt-10">
          {content.sections.map((section, index) => (
            <Fragment key={section.id || index}>
              <section aria-labelledby={`legal-${section.id || index}`}>
                <h2
                  id={`legal-${section.id || index}`}
                  className="m-0 mb-3 text-[26px] leading-[1.15] tracking-[-0.01em] sm:text-[29px]"
                >
                  {section.title}
                </h2>
                <div className="flex flex-col gap-3 text-muted-foreground">
                  {renderBody(section.body)}
                </div>
              </section>
            </Fragment>
          ))}
          {content.cta ? (
            <Link href={content.cta.href} className={`${HOME_BTN_PRIMARY} ${BTN_LG} w-fit`}>
              {content.cta.label}
            </Link>
          ) : null}
        </div>
      </div>
    </DesignShell>
  )
}
