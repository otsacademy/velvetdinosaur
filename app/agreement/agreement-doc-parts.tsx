import Image from "next/image"
import type { ReactNode } from "react"

import { CONTRACTING_PARTY, REGISTERED_DETAILS_LINE } from "@/lib/legal-identity"
import {
  ACCEPTANCE_BLOCKS,
  AGREEMENT_DATE_LABEL,
  AGREEMENT_VERSION,
  AGREEMENT_VERSION_LABEL,
  AGREEMENT_VERSION_SHORT,
  KEY_TILES,
  ORDER_FIELDS,
  SHORT_VERSION,
  type AgreementBlock,
  type AgreementSection,
} from "./agreement-content"

const MONO = "[font-family:var(--font-mono,ui-monospace,monospace)]"

/** Renders **bold** runs inside agreement copy. */
export function RichText({ text }: { text: string }) {
  const parts = text.split("**")
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <strong key={index} className="font-semibold text-(--ink)">
            {part}
          </strong>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  )
}

function Blocks({ blocks }: { blocks: AgreementBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "h3":
            return (
              <h3
                key={index}
                className={`${MONO} m-0 mb-1.5 text-[11px] leading-[1.3] font-bold tracking-[0.08em] uppercase text-(--accent) [break-after:avoid]`}
              >
                {block.text}
              </h3>
            )
          case "list":
          case "ordered": {
            const items = block.items.map((item) => (
              <li key={item} className="text-[15.5px] leading-[1.62] tracking-[-0.002em]">
                <RichText text={item} />
              </li>
            ))
            return block.type === "list" ? (
              <ul data-list className="m-0 mb-3 grid list-disc gap-1.5 pl-5">
                {items}
              </ul>
            ) : (
              <ol data-list className="m-0 mb-3 grid list-decimal gap-1.5 pl-5">
                {items}
              </ol>
            )
          }
          case "keybox":
            return (
              <div
                key={index}
                data-tile
                className="mb-3.5 border-l-[3px] border-(--good) bg-(--tint) px-[18px] py-4"
              >
                <p className="m-0 text-[16.5px] leading-[1.66] tracking-[-0.004em] text-(--ink) [orphans:3] [widows:3]">
                  <RichText text={block.text} />
                </p>
              </div>
            )
          case "small":
            return (
              <p
                key={index}
                className="m-0 text-[13.5px] leading-[1.62] tracking-[-0.002em] text-(--ink-3) [orphans:3] [widows:3]"
              >
                <RichText text={block.text} />
              </p>
            )
          default:
            return (
              <p
                key={index}
                className="m-0 mb-3 text-[15.5px] leading-[1.68] tracking-[-0.002em] text-(--ink) [orphans:3] [widows:3] last:mb-0"
              >
                <RichText text={block.text} />
              </p>
            )
        }
      })}
    </>
  )
}

function Cover() {
  return (
    <div data-cover className="pt-[38px]">
      <div className={`${MONO} text-[10px] leading-[1.4] tracking-[0.14em] uppercase text-(--accent)`}>
        The small print, in plain English
      </div>
      <h1 className="m-0 mt-3.5 text-[40px] leading-[1.04] font-medium tracking-[-0.036em] text-(--ink) sm:text-[56px]">
        Service Agreement
      </h1>
      <p className="m-0 mt-5 max-w-[5.1in] text-[15.5px] leading-[1.68] tracking-[-0.002em] text-(--ink-2)">
        These terms are between you — the business or organisation named in the order
        (&ldquo;Customer&rdquo;, &ldquo;you&rdquo;, &ldquo;your&rdquo;) — and{" "}
        <strong className="font-semibold text-(--ink)">{CONTRACTING_PARTY}</strong> (&ldquo;Velvet
        Dinosaur&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo; or &ldquo;our&rdquo;). Your order,
        together with this agreement, forms the contract between us.
      </p>
      <div
        className={`${MONO} m-0 mt-[26px] flex flex-wrap gap-x-[26px] gap-y-2 border-b-2 border-(--ink) pb-[26px] text-[10px] leading-[1.4] tracking-[0.06em] uppercase text-(--ink-3)`}
      >
        <span>{AGREEMENT_VERSION_LABEL}</span>
        <span>{AGREEMENT_DATE_LABEL}</span>
        <span>Law of England &amp; Wales</span>
      </div>

      <h2
        className={`${MONO} m-0 mt-[38px] mb-4 text-[13px] leading-none font-semibold tracking-[0.1em] uppercase text-(--ink)`}
      >
        The short version
      </h2>
      <div className="grid gap-x-[30px] gap-y-3.5 sm:grid-cols-2">
        {SHORT_VERSION.map((line) => (
          <div key={line} data-tick className="grid grid-cols-[16px_1fr] gap-[9px]">
            <span className={`${MONO} text-[13px] leading-[1.5] font-bold text-(--good)`}>✓</span>
            <span className="text-[14px] leading-[1.5] text-(--ink-2)">
              <RichText text={line} />
            </span>
          </div>
        ))}
      </div>

      <h2
        className={`${MONO} m-0 mt-10 mb-3.5 text-[13px] leading-none font-semibold tracking-[0.1em] uppercase text-(--ink)`}
      >
        Key terms at a glance
      </h2>
      <div data-tiles-grid className="grid gap-px border border-(--rule) bg-(--rule) sm:grid-cols-3">
        {KEY_TILES.map((tile) => (
          <div key={tile.ref} data-tile className="bg-(--paper) px-3.5 py-4">
            <div
              className={`${MONO} text-[26px] leading-none font-medium tracking-[-0.045em] ${
                tile.accent ? "text-(--accent)" : "text-(--ink)"
              }`}
            >
              {tile.value}
            </div>
            <div className={`${MONO} mt-[7px] text-[10px] leading-[1.45] tracking-[0.04em] text-(--ink-3)`}>
              {tile.label}
              <br />
              <a href={tile.href} data-jump={tile.href.slice(1)}>
                {tile.ref}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ContentsNav({
  entries,
}: {
  entries: Array<{ id: string; num: string; title: string }>
}) {
  return (
    <>
      <h2
        className={`${MONO} m-0 mt-11 mb-4 border-t border-(--rule) pt-[18px] text-[13px] leading-none font-semibold tracking-[0.1em] uppercase text-(--ink)`}
      >
        Contents
      </h2>
      <div className="gap-x-[0.45in] sm:columns-2">
        {entries.map((entry) => (
          <a
            key={entry.id}
            href={`#${entry.id}`}
            data-jump={entry.id}
            className="grid grid-cols-[24px_1fr] gap-1.5 border-b-0 py-[3px] text-(--ink-2)"
          >
            <span className={`${MONO} text-[10px] leading-[1.7] text-(--ink-3)`}>{entry.num}</span>
            <span className="text-[13px] leading-[1.5]">{entry.title}</span>
          </a>
        ))}
      </div>
    </>
  )
}

export function Clause({
  section,
  copied,
  onCopy,
  onToggle,
}: {
  section: AgreementSection
  copied: boolean
  onCopy: (id: string) => void
  onToggle: (id: string) => void
}) {
  const padded = section.num.padStart(2, "0")
  return (
    <section data-clause data-num={padded} id={section.id} className="vd-clause mb-[34px] pt-1.5">
      <div className="vd-clause-gutter">
        <div
          className={`${MONO} text-[27px] leading-none font-medium tracking-[-0.04em] ${
            section.id === "money-back-guarantee" ? "text-(--good)" : "text-(--rule-2)"
          }`}
        >
          {padded}
        </div>
        {section.note ? (
          <p
            data-note
            className={`${MONO} m-0 mt-2.5 text-[10.5px] leading-[1.62] tracking-[-0.015em] text-(--ink-3)`}
          >
            {section.note}
          </p>
        ) : null}
      </div>
      <div className="m-0 mb-3 flex items-baseline gap-2.5 [break-after:avoid]">
        <h2 className="m-0 flex-1 text-[23px] leading-[1.3] font-semibold tracking-[-0.021em] text-(--ink)">
          <span data-title>{section.title}</span>
        </h2>
        <button
          type="button"
          data-copy={section.id}
          data-noprint
          onClick={() => onCopy(section.id)}
          className={`${MONO} cursor-pointer rounded-[3px] border border-(--rule) bg-transparent px-[7px] py-[3px] text-[9px] leading-[1.3] tracking-[0.05em] uppercase text-(--ink-3) hover:border-(--accent) hover:text-(--accent)`}
        >
          {copied ? "copied" : "link"}
        </button>
        <button
          type="button"
          data-collapse
          data-noprint
          onClick={() => onToggle(section.id)}
          className={`${MONO} cursor-pointer rounded-[3px] border border-(--rule) bg-transparent px-[7px] py-[3px] text-[9px] leading-[1.3] tracking-[0.05em] uppercase text-(--ink-3) hover:border-(--accent) hover:text-(--accent)`}
        >
          <span data-when-open>hide</span>
          <span data-when-closed>show</span>
        </button>
      </div>
      <div data-body>
        <Blocks blocks={section.id === "acceptance" ? ACCEPTANCE_BLOCKS : section.blocks} />
        {section.id === "the-order" ? <OrderTable /> : null}
      </div>
    </section>
  )
}

function OrderTable() {
  return (
    <table data-order className="w-full border-collapse">
      <thead>
        <tr>
          <th
            className={`${MONO} w-[44%] border-b border-(--ink) pb-2 text-left text-[9px] leading-[1.3] font-bold tracking-[0.08em] uppercase text-(--ink-3)`}
          >
            Field
          </th>
          <th
            className={`${MONO} border-b border-(--ink) pb-2 text-left text-[9px] leading-[1.3] font-bold tracking-[0.08em] uppercase text-(--ink-3)`}
          >
            Recorded as
          </th>
        </tr>
      </thead>
      <tbody>
        {ORDER_FIELDS.map(([label, value]) => (
          <tr key={label}>
            <td className="border-b border-(--rule) py-2 pr-3 text-[14px] leading-[1.4] text-(--ink-2)">
              {label}
            </td>
            <td
              className={`${MONO} border-b border-(--rule) py-2 text-[12px] leading-[1.4] ${
                value.startsWith("[") ? "text-(--ink-3)" : "text-(--ink)"
              }`}
            >
              {value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Order clause table (design keeps it inside the "the-order" clause). */

function SignatureColumn({ label }: { label: string }) {
  return (
    <div data-sig>
      <div className={`${MONO} text-[9px] leading-[1.3] font-bold tracking-[0.09em] uppercase text-(--ink-3)`}>
        {label}
      </div>
      {["Name", "Signature", "Date"].map((field, index) => (
        <div key={field}>
          <div className={`border-b border-(--rule-2) ${index === 0 ? "mt-[34px]" : "mt-[26px]"}`} />
          <div className={`${MONO} mt-1.5 text-[10px] leading-[1.4] text-(--ink-3)`}>{field}</div>
        </div>
      ))}
    </div>
  )
}

export function SignatureBlocks() {
  return (
    <div className="clear-left mt-[26px] mb-[46px] grid gap-[34px] border-t-2 border-(--ink) pt-6 sm:grid-cols-2">
      <SignatureColumn label={`For ${CONTRACTING_PARTY}`} />
      <SignatureColumn label="For the customer" />
    </div>
  )
}

/** Running identity shown only on paper (the handoff's doc-page header slot). */
export function PrintHeader() {
  return (
    <div
      className={`vd-doc-print-only ${MONO} mb-[34px] flex justify-between text-[9px] leading-[1.4] tracking-[0.06em] uppercase text-(--ink-3)`}
    >
      <span>Velvet Dinosaur · Service Agreement</span>
      <span>{AGREEMENT_VERSION}</span>
    </div>
  )
}

/** Registered-details footer shown only on paper (the doc-page footer slot). */
export function PrintFooter() {
  return (
    <div
      className={`vd-doc-print-only ${MONO} border-t border-(--rule) pt-2 text-[9px] leading-[1.5] tracking-[0.04em] text-(--ink-3)`}
    >
      © 2026 Velvet Dinosaur. {REGISTERED_DETAILS_LINE} ·{" "}
      <a href="mailto:hello@velvetdinosaur.com">hello@velvetdinosaur.com</a>
    </div>
  )
}

export function DocCover() {
  return <Cover />
}

export function SidebarBrand() {
  return (
    <div className="border-b border-(--rule) px-5 pt-[22px] pb-4">
      <div className="flex items-center gap-2">
        <Image src="/logo.webp" alt="" width={18} height={18} className="h-[18px] w-[18px] object-contain" />
        <div className={`${MONO} text-[13px] leading-none font-bold tracking-[0.02em] text-(--ink)`}>
          Velvet Dinosaur
        </div>
      </div>
      <div
        className={`${MONO} mt-1.5 text-[10px] leading-[1.5] tracking-[0.06em] uppercase text-(--ink-3)`}
      >
        Service Agreement · {AGREEMENT_VERSION_SHORT}
      </div>
    </div>
  )
}
