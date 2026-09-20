/**
 * Cinder's house style for tours.
 *
 * The renderer starts from the library's `dark` surface (`appearance`), and
 * the templates layer Cinder's own tokens on top. Precedence runs
 * renderer → appearance → template → tour, so anything a template sets wins
 * over the preset it is sitting on.
 */

import type { DomRendererOptions, PopoverTemplate, SlotRenderer, Theme } from '@docentjs/vue'

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

/** Ember on charcoal, with the console's own typeface. */
const brand: Theme = {
  background: 'oklch(24.5% 0.016 60)',
  foreground: 'oklch(94% 0.008 60)',
  muted: 'oklch(72% 0.012 60)',
  accent: 'oklch(74% 0.165 58)',
  accentForeground: 'oklch(19% 0.04 60)',
  connector: 'oklch(74% 0.165 58)',
  ring: 'oklch(74% 0.165 58)',
  radius: 10,
  width: 344,
  font: "'Familjen Grotesk', ui-sans-serif, system-ui, sans-serif",
  shadow: '0 24px 56px -24px oklch(8% 0.02 60 / 0.95)',
  overlay: 'oklch(12% 0.014 60)',
  overlayOpacity: 0.66,
  duration: 200,
}

const title: SlotRenderer = (ctx, doc) => {
  const wrap = el(doc, 'div', 'tp-title')
  const kicker = ctx.step.target ? (ctx.tour.name ?? '') : 'Cinder'
  wrap.appendChild(el(doc, 'span', 'tp-kicker', kicker))
  wrap.appendChild(el(doc, 'h2', 'tp-heading', ctx.step.title ?? ''))
  return wrap
}

/** The console look: monospace counter, hard segments, square-ish corners. */
const cinder: PopoverTemplate = {
  theme: brand,
  spotlight: { ring: 'hairline', padding: 8, radius: 8, animate: true },
  slots: {
    title,
    progress: (ctx, doc) => {
      const { current, total } = ctx.progress
      const wrap = el(doc, 'div', 'tp-progress')
      wrap.appendChild(el(doc, 'span', 'tp-count', `${String(current).padStart(2, '0')}/${total}`))
      const segments = el(doc, 'span', 'tp-segments')
      for (let i = 1; i <= total; i++) {
        const seg = el(doc, 'i', '')
        if (i <= current) seg.dataset.done = ''
        segments.appendChild(seg)
      }
      wrap.appendChild(segments)
      return wrap
    },
  },
  css: `
    .popover { padding: 16px 16px 12px; }
    .body { margin-top: 8px; }
    .footer { margin-top: 16px; }
    .button { border-radius: 6px; }
  `,
}

/**
 * For a tip that must not stop the page: no scrim, a pulsing ring so it is
 * findable at 03:00, and a dotted pin instead of a caret.
 */
const signal: PopoverTemplate = {
  theme: { ...brand, width: 300 },
  overlay: { style: 'none' },
  spotlight: { ring: 'pulse', padding: 6, radius: 8 },
  arrow: 'pin',
  slots: { title, progress: () => null },
  css: `.popover { padding: 14px; } .footer { margin-top: 12px; }`,
}

export const rendererDefaults: DomRendererOptions = {
  appearance: 'dark',
  gap: 12,
  templates: { cinder, signal },
  labels: { skip: 'Dismiss', close: 'Dismiss' },
}
