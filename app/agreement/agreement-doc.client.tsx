"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import {
  ALL_CLAUSES,
  type AgreementBlock,
  type AgreementSection,
} from "./agreement-content"
import {
  Clause,
  ContentsNav,
  DocCover,
  PrintFooter,
  PrintHeader,
  SidebarBrand,
  SignatureBlocks,
} from "./agreement-doc-parts"

const MONO = "[font-family:var(--font-mono,ui-monospace,monospace)]"

type ClauseIndex = { id: string; num: string; title: string; text: string }

function blocksToText(blocks: AgreementBlock[]): string {
  return blocks
    .map((block) => ("items" in block ? block.items.join(" ") : block.text))
    .join(" ")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

const CLAUSES: ClauseIndex[] = ALL_CLAUSES.map((section: AgreementSection) => ({
  id: section.id,
  num: section.num.padStart(2, "0"),
  title: section.title,
  text: `${section.title} ${blocksToText(section.blocks)}`,
}))

/** Live height of the sticky site header, so scroll targets clear it. */
function headerHeight(): number {
  return document.querySelector("header")?.getBoundingClientRect().height ?? 0
}

function snippet(c: ClauseIndex, q: string): string {
  if (!q) return `${c.text.slice(0, 74)}…`
  const i = c.text.toLowerCase().indexOf(q)
  if (i < 0) return `${c.text.slice(0, 74)}…`
  const s = Math.max(0, i - 26)
  return `${s ? "…" : ""}${c.text.slice(s, s + 78)}…`
}

export function AgreementDoc() {
  const [q, setQ] = useState("")
  const [filter, setFilter] = useState(false)
  const [palette, setPalette] = useState(false)
  const [pq, setPq] = useState("")
  const [psel, setPsel] = useState(0)
  const [mi, setMi] = useState(0)
  const [mc, setMc] = useState(0)
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [flashId, setFlashId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [footerInView, setFooterInView] = useState(false)

  const barRef = useRef<HTMLDivElement | null>(null)
  const docRef = useRef<HTMLDivElement | null>(null)
  const navRef = useRef<HTMLElement | null>(null)
  const pRef = useRef<HTMLInputElement | null>(null)
  const rangesRef = useRef<Range[]>([])
  const activeRef = useRef<string | null>(null)

  /* ---------- navigation ---------- */

  const scrollToId = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    const y = el.getBoundingClientRect().top + window.scrollY - headerHeight() - 20
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" })
  }, [])

  const jump = useCallback(
    (id: string, push = true) => {
      if (!document.getElementById(id)) return
      scrollToId(id)
      setFlashId(id)
      window.setTimeout(() => setFlashId((current) => (current === id ? null : current)), 1900)
      if (push) history.replaceState(null, "", `#${id}`)
    },
    [scrollToId],
  )

  /* ---------- search highlight (CSS Custom Highlight API) ---------- */

  const markCurrent = useCallback((index: number, scroll: boolean) => {
    if (!window.CSS || !CSS.highlights) return
    CSS.highlights.delete("vd-cur")
    const range = rangesRef.current[index]
    if (!range) return
    CSS.highlights.set("vd-cur", new Highlight(range))
    if (scroll) {
      const rect = range.getBoundingClientRect()
      if (rect.height) window.scrollTo({ top: rect.top + window.scrollY - 200, behavior: "smooth" })
    }
  }, [])

  const highlight = useCallback(
    (query: string) => {
      if (!window.CSS || !CSS.highlights) return
      CSS.highlights.delete("vd-find")
      CSS.highlights.delete("vd-cur")
      rangesRef.current = []
      const needle = query.trim().toLowerCase()
      if (needle.length < 2) {
        setMc(0)
        setMi(0)
        return
      }
      const root = docRef.current
      if (!root) return
      const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      const ranges: Range[] = []
      let node: Node | null
      while ((node = walk.nextNode())) {
        const hay = (node.nodeValue || "").toLowerCase()
        let i = hay.indexOf(needle)
        while (i > -1) {
          const range = document.createRange()
          range.setStart(node, i)
          range.setEnd(node, i + needle.length)
          ranges.push(range)
          i = hay.indexOf(needle, i + needle.length)
        }
      }
      rangesRef.current = ranges
      if (ranges.length) CSS.highlights.set("vd-find", new Highlight(...ranges))
      const next = Math.min(mi, Math.max(0, ranges.length - 1))
      setMc(ranges.length)
      setMi(next)
      markCurrent(next, false)
    },
    [markCurrent, mi],
  )

  const step = useCallback(
    (d: number) => {
      const total = rangesRef.current.length
      if (!total) return
      const next = (mi + d + total) % total
      setMi(next)
      markCurrent(next, true)
    },
    [markCurrent, mi],
  )

  /* ---------- palette ---------- */

  const results = useMemo(() => {
    const needle = pq.trim().toLowerCase()
    if (!needle) return CLAUSES.slice(0, 8)
    return CLAUSES.filter((c) => c.text.toLowerCase().includes(needle)).slice(0, 20)
  }, [pq])

  const openPalette = useCallback(() => {
    setPalette(true)
    setPq("")
    setPsel(0)
  }, [])

  /* ---------- effects ---------- */

  useEffect(() => {
    const onScroll = () => {
      const bar = barRef.current
      const h = document.documentElement.scrollHeight - window.innerHeight
      if (bar) bar.style.width = `${h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0}%`
      // the floating back-to-top button would otherwise cover the footer links
      const footer = document.querySelector("[data-site-footer]")
      setFooterInView(footer ? footer.getBoundingClientRect().top < window.innerHeight : false)
      let active: string | null = null
      for (const clause of CLAUSES) {
        const el = document.getElementById(clause.id)
        if (el && el.getBoundingClientRect().top < headerHeight() + 70) active = clause.id
      }
      if (active !== activeRef.current) {
        activeRef.current = active
        setActiveId(active)
        const nav = navRef.current
        if (nav && active) {
          const link = nav.querySelector<HTMLAnchorElement>(`[data-nav][href="#${active}"]`)
          if (link) {
            const target = link.offsetTop - nav.clientHeight / 2
            if (Math.abs(nav.scrollTop - target) > nav.clientHeight * 0.45) {
              nav.scrollTop = Math.max(0, target)
            }
          }
        }
      }
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const k = (event.key || "").toLowerCase()
      if ((event.metaKey || event.ctrlKey) && (k === "k" || k === "f")) {
        event.preventDefault()
        openPalette()
        return
      }
      if (!palette) return
      if (k === "escape") {
        setPalette(false)
        return
      }
      if (k === "arrowdown") {
        event.preventDefault()
        setPsel((v) => Math.min(results.length - 1, v + 1))
      } else if (k === "arrowup") {
        event.preventDefault()
        setPsel((v) => Math.max(0, v - 1))
      } else if (k === "enter") {
        event.preventDefault()
        const r = results[psel]
        if (r) {
          setPalette(false)
          window.setTimeout(() => jump(r.id), 30)
        }
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [jump, openPalette, palette, psel, results])

  useEffect(() => {
    if (palette && pRef.current) pRef.current.focus()
  }, [palette])

  useEffect(() => {
    if (location.hash.length > 1) {
      const id = location.hash.slice(1)
      window.setTimeout(() => jump(id, false), 700)
    }
  }, [jump])

  useEffect(() => {
    const reset = () => {
      setFilter(false)
      setCollapsed(new Set())
    }
    window.addEventListener("beforeprint", reset)
    return () => window.removeEventListener("beforeprint", reset)
  }, [])

  /* ---------- handlers ---------- */

  const onQuery = (value: string) => {
    setQ(value)
    setMi(0)
    highlight(value)
  }

  const toggleCollapse = (id: string) => {
    setCollapsed((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const copyLink = (id: string) => {
    const url = `${location.origin}${location.pathname}#${id}`
    try {
      navigator.clipboard.writeText(url)
    } catch {
      /* clipboard unavailable — still update the hash */
    }
    history.replaceState(null, "", `#${id}`)
    setCopiedId(id)
    window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1400)
  }

  const doPrint = () => {
    setFilter(false)
    setCollapsed(new Set())
    window.setTimeout(() => window.print(), 120)
  }

  /* ---------- derived view state ---------- */

  const needle = q.trim().toLowerCase()
  const filtering = filter && needle.length > 1
  const hiddenIds = filtering
    ? new Set(CLAUSES.filter((c) => !c.text.toLowerCase().includes(needle)).map((c) => c.id))
    : null
  const navEntries = CLAUSES.filter(
    (c) => !needle || c.text.toLowerCase().includes(needle),
  )
  const matchLabel =
    q.trim().length < 2 ? "" : mc ? `${mi + 1} / ${mc} matches` : "no matches"

  return (
    <div className="vd-doc min-h-screen">
      {/* fixed sidebar */}
      <aside
        data-chrome
        className="z-40 flex flex-col border-b border-(--rule) bg-(--chrome) lg:fixed lg:top-(--vd-header-h) lg:bottom-0 lg:left-0 lg:w-[298px] lg:border-r lg:border-b-0"
      >
        <SidebarBrand />
        <div className="grid gap-2.5 border-b border-(--rule) px-5 pt-4 pb-3.5">
          <div className="relative flex items-center">
            <input
              value={q}
              onChange={(event) => onQuery(event.target.value)}
              placeholder="Search the agreement"
              className={`${MONO} w-full box-border rounded border border-(--rule-2) bg-(--paper) py-[9px] pr-[46px] pl-[11px] text-[12px] leading-[1.3] text-(--ink) outline-none focus:border-(--accent)`}
            />
            <span
              className={`${MONO} absolute right-[9px] rounded-[3px] border border-(--rule-2) px-[5px] py-[3px] text-[9px] leading-none tracking-[0.06em] text-(--ink-3)`}
            >
              ⌘K
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => step(-1)}
              className={`${MONO} cursor-pointer rounded-[3px] border border-(--rule-2) bg-(--paper) px-[9px] py-[5px] text-[11px] leading-none text-(--ink-2) hover:border-(--accent) hover:text-(--accent)`}
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              className={`${MONO} cursor-pointer rounded-[3px] border border-(--rule-2) bg-(--paper) px-[9px] py-[5px] text-[11px] leading-none text-(--ink-2) hover:border-(--accent) hover:text-(--accent)`}
            >
              ↓
            </button>
            <span className={`${MONO} flex-1 text-right text-[10px] leading-[1.4] text-(--ink-3)`}>
              {matchLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setFilter((v) => !v)}
            className={`${MONO} w-full cursor-pointer rounded border border-(--rule-2) bg-(--paper) px-2.5 py-[7px] text-left text-[10px] leading-[1.3] tracking-[0.05em] uppercase text-(--ink-2) hover:border-(--accent) hover:text-(--accent)`}
          >
            {filtering ? "↺ showing matching clauses" : "Filter to matching clauses"}
          </button>
        </div>
        <nav ref={navRef} className="hidden flex-1 overflow-y-auto px-3 pt-2.5 pb-[18px] lg:block">
          {navEntries.map((entry) => (
            <a
              key={entry.id}
              data-nav
              data-active={activeId === entry.id ? "1" : undefined}
              href={`#${entry.id}`}
              onClick={(event) => {
                event.preventDefault()
                jump(entry.id)
              }}
              className="grid grid-cols-[26px_1fr] items-baseline gap-2 rounded px-2 py-1.5 text-(--ink-2) no-underline"
              style={{ borderBottom: "none" }}
            >
              <span data-navnum className={`${MONO} text-[10px] leading-[1.5] text-(--ink-3)`}>
                {entry.num}
              </span>
              <span className="text-[13px] leading-[1.4]">{entry.title}</span>
            </a>
          ))}
        </nav>
        <div className="flex gap-2 border-t border-(--rule) px-4 py-3">
          <button
            type="button"
            onClick={doPrint}
            className={`${MONO} flex-1 cursor-pointer rounded border border-(--rule-2) bg-(--paper) px-1.5 py-2 text-[10px] leading-[1.3] tracking-[0.04em] text-(--ink-2) hover:border-(--accent) hover:text-(--accent)`}
          >
            PDF
          </button>
        </div>
      </aside>

      {/* reading progress */}
      <div data-chrome className="fixed top-(--vd-header-h) right-0 left-0 z-[45] h-[3px] bg-(--rule) lg:left-[298px]">
        <div ref={barRef} className="h-full w-0 bg-(--accent)" />
      </div>

      {/* back to top — hidden once the site footer is on screen */}
      <button
        type="button"
        data-chrome
        hidden={footerInView}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        className={`${MONO} fixed right-[26px] bottom-[26px] z-[45] h-[42px] w-[42px] cursor-pointer rounded-full border border-(--rule-2) bg-(--paper) text-[14px] leading-none text-(--ink-2) shadow-[0_2px_10px_rgba(0,0,0,.08)] hover:border-(--accent) hover:text-(--accent)`}
      >
        ↑
      </button>

      {/* command palette */}
      {palette ? (
        <div
          data-chrome
          onClick={() => setPalette(false)}
          className="fixed inset-0 z-[60] flex items-start justify-center bg-[color-mix(in_oklch,var(--ink)_34%,transparent)] pt-[12vh] backdrop-blur-[3px]"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="w-[640px] max-w-[90vw] overflow-hidden rounded-lg border border-(--rule-2) bg-(--paper) shadow-[0_24px_70px_rgba(0,0,0,.28)]"
          >
            <input
              ref={pRef}
              value={pq}
              onChange={(event) => {
                setPq(event.target.value)
                setPsel(0)
              }}
              placeholder="Jump to a clause or search the text…"
              className={`${MONO} w-full box-border border-0 border-b border-(--rule) bg-transparent px-5 py-[18px] text-[15px] leading-[1.3] text-(--ink) outline-none`}
            />
            <div className="max-h-[52vh] overflow-y-auto p-2">
              {results.map((r, i) => (
                <div
                  key={r.id}
                  data-row
                  data-sel={i === psel ? "1" : "0"}
                  onClick={() => {
                    setPalette(false)
                    window.setTimeout(() => jump(r.id), 30)
                  }}
                  onMouseEnter={() => setPsel(i)}
                  className="grid cursor-pointer grid-cols-[34px_1fr] gap-2.5 rounded-[5px] px-3 py-2.5"
                >
                  <span className={`${MONO} text-[11px] leading-[1.6] text-(--accent)`}>{r.num}</span>
                  <span>
                    <span className="block text-[15px] leading-[1.3] font-medium text-(--ink)">
                      {r.title}
                    </span>
                    <span className={`${MONO} mt-[3px] block text-[11px] leading-[1.5] text-(--ink-3)`}>
                      {snippet(r, pq.trim().toLowerCase())}
                    </span>
                  </span>
                </div>
              ))}
            </div>
            <div
              className={`${MONO} flex gap-4 border-t border-(--rule) bg-(--tint) px-4 py-[9px] text-[9px] leading-[1.4] tracking-[0.05em] uppercase text-(--ink-3)`}
            >
              <span>↑↓ move</span>
              <span>↵ open</span>
              <span>esc close</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* document */}
      <div className="vd-doc-main lg:ml-[298px]">
        <div className="mx-auto max-w-[8.5in] px-7 pt-[52px] pb-[90px]">
          <PrintHeader />
          <div data-cover-wrap {...(hiddenIds ? { "data-vd-hidden": true } : {})}>
            <DocCover />
            <ContentsNav entries={CLAUSES.map(({ id, num, title }) => ({ id, num, title }))} />
          </div>
          <div ref={docRef} className="mt-4">
            {ALL_CLAUSES.map((section, index) => (
              <div
                key={section.id}
                className={index === 0 ? "[break-before:page]" : undefined}
                {...(hiddenIds?.has(section.id) ? { "data-vd-hidden": true } : {})}
                {...(collapsed.has(section.id) ? { "data-vd-collapsed": true } : {})}
                {...(flashId === section.id ? { "data-flash": true } : {})}
              >
                <Clause section={section} copied={copiedId === section.id} onCopy={copyLink} onToggle={toggleCollapse} />
              </div>
            ))}
            <SignatureBlocks />
          </div>
          <PrintFooter />
        </div>
      </div>
    </div>
  )
}
