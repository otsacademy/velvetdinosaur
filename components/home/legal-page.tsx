import { Fragment, type ReactNode } from "react"

import { DesignShell } from "@/components/home/design-shell"
import { HOME_CONTAINER, HOME_KICKER } from "@/components/home/home-shared"
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
            <span aria-hidden className="text-primary">
              •
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>,
    )
  }

  for (const rawLine of body.split("\n")) {
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
      <section className="border-b border-border bg-background">
        <div className={`${HOME_CONTAINER} py-12 md:pb-14 md:pt-16`}>
          <div className={`${HOME_KICKER} mb-4 text-[11px] text-primary`}>{content.badgeLabel}</div>
          <h1 className="m-0 max-w-[720px] text-balance text-4xl font-extrabold tracking-[-0.033em] md:text-[42px]">
            {content.title}
          </h1>
          {content.description ? (
            <p className="m-0 mt-4 max-w-[640px] text-[15.5px] leading-[1.7] text-muted-foreground">
              {content.description}
            </p>
          ) : null}
        </div>
      </section>
      <div className={`${HOME_CONTAINER} pb-16 pt-10 md:pb-[72px]`}>
        <div className="flex max-w-[760px] flex-col gap-9">
          {content.sections.map((section, index) => (
            <Fragment key={section.id || index}>
              <section aria-labelledby={`legal-${section.id || index}`}>
                <h2
                  id={`legal-${section.id || index}`}
                  className="m-0 mb-3 text-[19px] font-bold tracking-[-0.01em]"
                >
                  {section.title}
                </h2>
                <div className="flex flex-col gap-3 text-[14.5px] leading-[1.7] text-muted-foreground">
                  {renderBody(section.body)}
                </div>
              </section>
            </Fragment>
          ))}
        </div>
      </div>
    </DesignShell>
  )
}
