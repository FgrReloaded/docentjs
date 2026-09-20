/**
 * Pressroom's house style for tours.
 *
 * The built-in popover is kept, but three of its regions are replaced with
 * our own DOM through named slots: the title is set in the headline face, the
 * progress counter is a folio in roman numerals, and the buttons are the
 * paper's own rules-and-caps treatment rather than filled pills.
 */

import type { DomRendererOptions, PopoverTemplate, SlotRenderer, Theme } from '@docentjs/svelte'

function el<K extends keyof HTMLElementTagNameMap>(
  doc: Document,
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = doc.createElement(tag)
  node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
const roman = (n: number) => ROMAN[n - 1] ?? String(n)

const brand: Theme = {
  background: 'oklch(99% 0.007 85)',
  foreground: 'oklch(18% 0.012 60)',
  muted: 'oklch(45% 0.012 60)',
  accent: 'oklch(54% 0.2 32)',
  accentForeground: 'oklch(99% 0.007 85)',
  connector: 'oklch(18% 0.012 60)',
  ring: 'oklch(54% 0.2 32)',
  radius: 3,
  width: 364,
  font: "'Karla', ui-sans-serif, system-ui, sans-serif",
  // Print does not have drop shadows; a hairline and a hard offset do the work.
  shadow: '6px 6px 0 oklch(18% 0.012 60 / 0.09)',
  overlay: 'oklch(24% 0.03 60)',
  overlayOpacity: 0.46,
  duration: 190,
}

const title: SlotRenderer = (ctx, doc) => {
  const wrap = el(doc, 'div', 'tp-title')
  wrap.appendChild(el(doc, 'span', 'tp-kicker', ctx.tour.name ?? 'Pressroom'))
  wrap.appendChild(el(doc, 'h2', 'tp-heading', ctx.step.title ?? ''))
  return wrap
}

/** The desk look. */
const broadsheet: PopoverTemplate = {
  theme: brand,
  spotlight: { padding: 8, radius: 3, ring: 'hairline', animate: true },
  arrow: 'caret',
  slots: {
    title,
    // A folio, the way a page number is set at the foot of a column.
    progress: (ctx, doc) =>
      el(doc, 'span', 'tp-folio', `${roman(ctx.progress.current)} of ${roman(ctx.progress.total)}`),
    // Our own buttons, wired to the same actions the built-in ones use.
    buttons: (ctx, doc) => {
      const wrap = el(doc, 'div', 'tp-buttons')
      const add = (label: string, className: string, run: () => void) => {
        const button = el(doc, 'button', className, label)
        button.type = 'button'
        button.addEventListener('click', run)
        wrap.appendChild(button)
      }
      if (!ctx.isLast) add('Leave', '', ctx.actions.skip)
      if (ctx.canGoBack) add('Back', '', ctx.actions.back)
      add(ctx.isLast ? 'Close' : 'Next', 'tp-primary', ctx.actions.next)
      return wrap
    },
  },
  css: `
    .popover { padding: 18px 20px 16px; }
    .body { margin-top: 8px; }
    .footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid color-mix(in oklch, var(--docent-fg) 14%, transparent); }
  `,
}

/**
 * A galley proof pinned to the page: no scrim, a dashed ring, and a
 * hand-drawn stroke reaching across instead of a caret.
 */
const galley: PopoverTemplate = {
  theme: { ...brand, width: 300 },
  overlay: { style: 'none' },
  spotlight: { ring: 'dashed', padding: 7, radius: 3 },
  arrow: 'sketch',
  slots: { title, progress: () => null },
  css: `.popover { padding: 14px 16px 12px; } .footer { margin-top: 14px; }`,
}

/** Shared by the manager and by every single-tour controller in the app. */
export const rendererDefaults: DomRendererOptions = {
  theme: brand,
  gap: 14,
  templates: { broadsheet, galley },
  labels: { next: 'Next', back: 'Back', skip: 'Leave', done: 'Close', close: 'Close' },
}
