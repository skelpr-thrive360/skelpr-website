import { useEffect, useMemo, useRef, useState, isValidElement, type ReactNode } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft, ArrowRight, Check, Copy } from 'lucide-react'
import { BrandMark } from '../components/BrandMark'
import { ThemeToggle } from '../components/ThemeToggle'
import { useScrolled } from '../hooks/useScrolled'
import { useThemeEffect } from '../lib/theme'
import { navItems } from '../lib/navItems'
import install from './install.md?raw'
import { useTocSpy } from './useTocSpy'

/**
 * The /docs page: one markdown document, rendered, with a table of contents built
 * from the headings themselves.
 *
 * The source of truth is `install.md` — the same text a reader could open on
 * GitHub — and everything else here is derived from it. The contents list is
 * parsed out of the same string the article is rendered from, and a heading's id
 * is the slug of its own text, so a heading can never lose its anchor: renaming
 * one renames the link in the contents in the same edit.
 *
 * Fenced code is skipped when the contents are parsed. Every command block in the
 * document starts lines with `#`, and a `#` inside a fence is a shell comment, not
 * a heading — counting it would put "start the embedding server" in the sidebar.
 */

type TocEntry = { level: 2 | 3; text: string; id: string }

/** Inline markdown to its plain text, so a slug matches the rendered heading. */
function stripMarkdown(text: string) {
  return text
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** The text inside a rendered node, so a heading's id comes from what it says. */
function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children)
  return ''
}

function tocOf(markdown: string): TocEntry[] {
  const entries: TocEntry[] = []
  let inFence = false
  for (const line of markdown.split('\n')) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    const match = /^(#{2,3})\s+(.+?)\s*$/.exec(line)
    if (!match) continue
    const text = stripMarkdown(match[2])
    entries.push({ level: match[1].length as 2 | 3, text, id: slugify(text) })
  }
  return entries
}

/**
 * Put *text* on the clipboard, and say whether it worked.
 *
 * The async Clipboard API is the right one, and it is only available in a secure
 * context — which a self-hosted preview over plain http is not. The fallback is the
 * older selection copy, kept for exactly that case rather than as a general path;
 * when both fail the caller is told, so the button never claims a copy that did not
 * happen.
 */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Fall through: permission denied, or the document is not focused.
  }
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.top = '-1000px'
    document.body.append(area)
    area.select()
    const copied = document.execCommand('copy')
    area.remove()
    return copied
  } catch {
    return false
  }
}

/**
 * Is this block an instruction or something a program printed?
 *
 * The fence's info string answers it, carried onto the rendered `code` element as
 * `language-…`. A named language is a thing to paste; a bare fence is what a
 * command *answered* — nobody pastes that, so only the former gets the control.
 */
function isInput(children: ReactNode) {
  const parts = Array.isArray(children) ? children : [children]
  return parts.some((part) => {
    if (!isValidElement(part)) return false
    const className = (part.props as { className?: string }).className
    return typeof className === 'string' && /(^|\s)language-/.test(className)
  })
}

/**
 * One code block, with the copy control on the blocks where copying means something.
 *
 * The control is an icon on the block's first line, not a bar above it: a bar costs
 * a row on every block and reads as a heading. Its label lives in
 * `aria-label`/`title`, and the result is announced through a live region.
 */
function CodeBlock({ children }: { children?: ReactNode }) {
  const copyable = isInput(children)
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const onCopy = async () => {
    const copied = await copyText(textOf(children).replace(/^\n+|\n+$/g, ''))
    setState(copied ? 'copied' : 'failed')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setState('idle'), 1800)
  }

  const label =
    state === 'copied'
      ? 'Copied'
      : state === 'failed'
        ? 'Copy failed — select the block and copy it by hand'
        : 'Copy this block to the clipboard'

  // Output keeps the same panel, with no control and no space reserved for one.
  if (!copyable) {
    return (
      <div className="docs-code">
        <pre>{children}</pre>
      </div>
    )
  }

  return (
    <div className="docs-code has-copy">
      <button type="button" className={state === 'failed' ? 'docs-copy is-failed' : 'docs-copy'} onClick={onCopy} aria-label={label} title={label}>
        {state === 'copied' ? (
          <Check size={14} aria-hidden="true" />
        ) : (
          <Copy size={14} aria-hidden="true" />
        )}
      </button>
      <span className="visually-hidden" role="status">
        {state === 'copied' ? 'Copied to the clipboard' : state === 'failed' ? 'Copy failed' : ''}
      </span>
      <pre>{children}</pre>
    </div>
  )
}

function Contents({ entries, ids }: { entries: TocEntry[]; ids: string[] }) {
  // The spy lives here, not in the shell: crossing a heading re-renders this
  // list and nothing above it.
  const active = useTocSpy(ids)
  return (
    <ul className="docs-toc-list">
      {entries.map((entry) => (
        <li key={entry.id} className={entry.level === 3 ? 'docs-toc-sub' : undefined}>
          <a
            href={`#${entry.id}`}
            className={entry.id === active ? 'is-active' : undefined}
            aria-current={entry.id === active ? 'location' : undefined}
          >
            {entry.text}
          </a>
        </li>
      ))}
    </ul>
  )
}

export function DocsApp() {
  useThemeEffect()
  const scrolled = useScrolled()
  const entries = useMemo(() => tocOf(install), [])
  // Stable across renders, so the spy's listener is attached once, not per highlight.
  const entryIds = useMemo(() => entries.map((entry) => entry.id), [entries])

  return (
    <div className="docs-shell">
      {/* The same header furniture as the marketing page — brand, theme switch,
          one way back — so /docs reads as the same document, not a different site. */}
      <header className={scrolled ? 'site-header is-scrolled' : 'site-header'}>
        <a className="brand" href="/" aria-label="Skelpr home">
          <BrandMark />
          <span>skelpr</span>
        </a>
        {/* The same nav the marketing header names, linked across documents
            (`/#workflow` returns to the homepage and lands on the section). */}
        <nav className="main-nav docs-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <a key={item.id} href={`/#${item.id}`}>
              {item.label}
            </a>
          ))}
          <span className="docs-nav-current" aria-current="page">
            Docs
          </span>
        </nav>
        <div className="header-actions">
          <ThemeToggle />
          <a className="header-cta" href="/">
            <ArrowLeft size={15} /> Back to site
          </a>
        </div>
      </header>

      <div className="docs-body">
        <aside className="docs-aside">
          <nav className="docs-toc" aria-label="On this page">
            <p className="docs-toc-label">On this page</p>
            <Contents entries={entries} ids={entryIds} />
          </nav>
        </aside>

        <main className="docs-main" id="docs-content">
          <details className="docs-toc-mobile">
            <summary>On this page</summary>
            <Contents entries={entries} ids={entryIds} />
          </details>

          <article className="docs-prose">
            <Markdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ children }) => <h2 id={slugify(textOf(children))}>{children}</h2>,
                h3: ({ children }) => <h3 id={slugify(textOf(children))}>{children}</h3>,
                pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
                a: ({ href, children }) => {
                  const external = typeof href === 'string' && /^https?:/.test(href)
                  return (
                    <a
                      href={href}
                      target={external ? '_blank' : undefined}
                      rel={external ? 'noreferrer' : undefined}
                    >
                      {children}
                    </a>
                  )
                },
              }}
            >
              {install}
            </Markdown>
          </article>

          <nav className="docs-pager" aria-label="Where to go next">
            <a href="/">
              <ArrowLeft size={15} /> The product site
            </a>
            <a href="/#waitlist">Request access <ArrowRight size={15} /></a>
          </nav>
        </main>
      </div>

      <footer className="docs-footer">
        <div className="docs-footer-inner">
          <a className="brand" href="/">
            <BrandMark />
            <span>skelpr</span>
          </a>
          <p>Install and activate — the first two steps, in full.</p>
          <span className="docs-footer-note">local-first · no telemetry</span>
        </div>
      </footer>
    </div>
  )
}
