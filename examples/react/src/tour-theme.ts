/**
 * Ledgerline's house style for tours: one set of theme tokens plus three
 * named templates the tour JSON selects with `options.template`.
 *
 * Slot content is built as ordinary DOM and projected into the popover's
 * shadow root, so it lives in the page and picks up `styles.css` like
 * anything else on the page.
 */

import type { DomRendererOptions, PopoverTemplate, SlotRenderer } from '@docentjs/react'

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

/** Brand tokens. Tours and templates layer on top of these. */
const tokens: DomRendererOptions['theme'] = {
  background: 'oklch(99.3% 0.005 95)',
  foreground: 'oklch(24% 0.014 95)',
  muted: 'oklch(58% 0.011 95)',
  accent: 'oklch(42% 0.082 155)',
  accentForeground: 'oklch(98% 0.012 155)',
  connector: 'oklch(42% 0.082 155)',
  ring: 'oklch(98% 0.01 95)',
  radius: 12,
  width: 352,
  font: "'Archivo', ui-sans-serif, -apple-system, sans-serif",
  shadow: '0 1px 2px oklch(24% 0.014 95 / 0.08), 0 26px 52px -26px oklch(24% 0.014 95 / 0.55)',
  overlay: 'oklch(32% 0.03 95)',
  overlayOpacity: 0.44,
  duration: 220,
}

/**
 * Every template sets its title the same way: the tour's name as a kicker,
 * then the step title in the display face the rest of the app uses.
 */
function brandTitle(kicker: string | undefined, size: 'md' | 'sm'): SlotRenderer {
  return (ctx, doc) => {
    const wrap = el(doc, 'div', 'tp-title')
    const label = kicker ?? ctx.tour.name
    if (label) {
      wrap.appendChild(el(doc, 'span', `tp-kicker${kicker ? ' tp-kicker--note' : ''}`, label))
    }
    wrap.appendChild(
      el(doc, 'h2', `tp-heading${size === 'sm' ? ' tp-heading--sm' : ''}`, ctx.step.title ?? ''),
    )
    return wrap
  }
}

/**
 * The default: a ruled counter instead of the built-in meter, and the tour's
 * own name set above the step title the way a ledger heading is.
 */
const ledgerline: PopoverTemplate = {
  slots: {
    title: brandTitle(undefined, 'md'),
    progress: (ctx, doc) => {
      const { current, total } = ctx.progress
      const wrap = el(doc, 'div', 'tp-progress')
      const count = el(doc, 'span', 'tp-count')
      count.textContent = `${String(current).padStart(2, '0')} / ${String(total).padStart(2, '0')}`
      const rule = el(doc, 'span', 'tp-rule')
      for (let i = 1; i <= total; i++) {
        const tick = el(doc, 'i', 'tp-tick')
        if (i <= current) tick.dataset.done = ''
        rule.appendChild(tick)
      }
      wrap.append(count, rule)
      return wrap
    },
  },
  css: `
    .popover { padding: 18px 18px 14px; }
    .body { margin-top: 8px; }
    .footer { margin-top: 18px; }
  `,
}

/**
 * A note in the margin: the page keeps working underneath, a glowing ring
 * marks the spot and a drawn curve reaches over to it.
 */
const marginNote: PopoverTemplate = {
  theme: { width: 296, radius: 10 },
  overlay: { style: 'none' },
  spotlight: { ring: 'glow', padding: 6, radius: 8 },
  arrow: 'curve',
  slots: {
    progress: () => null,
    title: brandTitle('Just now', 'sm'),
  },
  css: `.popover { padding: 14px 16px 12px; } .footer { margin-top: 14px; }`,
}

/** A release note: the page blurs away and a drawn figure carries the point. */
const bulletin: PopoverTemplate = {
  theme: { width: 452, radius: 14 },
  overlay: { style: 'blur', blur: 7, opacity: 0.5 },
  spotlight: { ring: 'none' },
  arrow: 'none',
  slots: {
    title: brandTitle('Release 14', 'md'),
    media: (ctx, doc) => {
      if (ctx.index !== 0) return null
      const figure = el(doc, 'div', 'tp-figure')
      figure.innerHTML = RELEASE_FIGURE
      return figure
    },
  },
  css: `.popover { padding: 20px; } .title { font-size: 20px; }`,
}

/**
 * A small diagram: statements on the left, matched entries on the right.
 * Static markup we author ourselves, so `innerHTML` is safe here.
 */
const RELEASE_FIGURE = `
<svg viewBox="0 0 412 116" role="img" aria-label="Statement lines matching invoices automatically">
  <g fill="none" stroke="oklch(81% 0.012 95)" stroke-width="1">
    <rect x="0.5" y="0.5" width="150" height="115" rx="7" />
    <rect x="261.5" y="0.5" width="150" height="115" rx="7" />
  </g>
  <g fill="oklch(58% 0.011 95)" font-family="Archivo, sans-serif" font-size="9" letter-spacing="0.08em">
    <text x="12" y="20">STATEMENT</text>
    <text x="273" y="20">LEDGER</text>
  </g>
  <g fill="oklch(91% 0.009 95)">
    <rect x="12" y="32" width="126" height="18" rx="4" />
    <rect x="12" y="58" width="126" height="18" rx="4" />
    <rect x="12" y="84" width="126" height="18" rx="4" />
    <rect x="273" y="32" width="126" height="18" rx="4" />
    <rect x="273" y="58" width="126" height="18" rx="4" />
    <rect x="273" y="84" width="126" height="18" rx="4" />
  </g>
  <g stroke="oklch(42% 0.082 155)" stroke-width="1.5" fill="none" stroke-linecap="round">
    <path d="M150 41 C 200 41, 210 41, 261 41" />
    <path d="M150 67 C 200 67, 210 93, 261 93" />
    <path d="M150 93 C 200 93, 210 67, 261 67" />
  </g>
  <g fill="oklch(42% 0.082 155)">
    <circle cx="261" cy="41" r="3" />
    <circle cx="261" cy="67" r="3" />
    <circle cx="261" cy="93" r="3" />
  </g>
</svg>`

/** Passed to `DocentProvider`, so every tour in the app inherits it. */
export const rendererDefaults: DomRendererOptions = {
  theme: tokens,
  gap: 14,
  spotlight: { padding: 8, radius: 9 },
  templates: { ledgerline, 'margin-note': marginNote, bulletin },
  labels: { close: 'Dismiss' },
}
