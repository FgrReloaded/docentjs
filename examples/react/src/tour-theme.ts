/**
 * Ledgerline's house style: brand tokens plus three named looks the tour JSON
 * selects with `options.template`. Data, apart from one slot for a diagram.
 */

import type { DocentTheme, DomRendererOptions, PopoverTemplate } from '@docentjs/react'

/** Brand tokens. Tours and templates layer on top. */
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

/** The default: the tour's name above the title, and a ruled counter. */
const ledgerline: DocentTheme = {
  eyebrow: '{tour}',
  progress: 'ticks',
  count: '{current2} / {total2}',
  // Custom properties cross the shadow boundary, so the page's scale works by name.
  css: `
    .popover { padding: 18px 18px 14px; }
    .body { margin-top: 8px; }
    /* A long tour's counter takes its own row rather than running under the buttons. */
    .footer { margin-top: 18px; flex-wrap: wrap; row-gap: 12px; }
    .title { font-family: var(--face-display); font-size: 1.25rem; letter-spacing: -0.02em; }
    .eyebrow { color: var(--pine); font-weight: 600; letter-spacing: 0.1em; }
    .count { font-weight: 600; letter-spacing: 0.06em; }
    .marks { flex: 1; }
    .marks i { flex: 1 1 8px; min-width: 0; max-width: 8px; border-radius: 999px; }
    .marks i[data-done] { background: var(--pine); }
  `,
}

/** A note in the margin: no scrim, a glowing ring, a drawn curve. */
const marginNote: DocentTheme = {
  theme: { width: 296, radius: 10 },
  overlay: { style: 'none' },
  spotlight: { ring: 'glow', padding: 6, radius: 8 },
  arrow: 'curve',
  eyebrow: 'Just now',
  progress: 'none',
  css: `
    .popover { padding: 14px 16px 12px; }
    .footer { margin-top: 14px; }
    .title { font-family: var(--face-display); font-size: 1.0625rem; }
    .eyebrow { color: var(--ink-3); font-weight: 600; letter-spacing: 0.1em; }
  `,
}

/** A release note: the page blurs away and a diagram carries the point. */
const bulletin: PopoverTemplate = {
  theme: { width: 452, radius: 14 },
  overlay: { style: 'blur', blur: 7, opacity: 0.5 },
  spotlight: { ring: 'none' },
  arrow: 'none',
  eyebrow: 'Release 14',
  // No field draws a diagram, so this one earns a slot.
  slots: {
    media: (ctx, doc) => {
      if (ctx.index !== 0) return null
      const figure = doc.createElement('div')
      figure.className = 'tp-figure'
      figure.innerHTML = RELEASE_FIGURE
      return figure
    },
  },
  css: `
    .popover { padding: 20px; }
    .title { font-family: var(--face-display); font-size: 20px; }
    .eyebrow { color: var(--pine); font-weight: 600; letter-spacing: 0.1em; }
  `,
}

/** Our own static markup, so `innerHTML` is safe. */
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

/** Passed to `DocentProvider`; every tour inherits it. */
export const rendererDefaults: DomRendererOptions = {
  theme: tokens,
  gap: 14,
  spotlight: { padding: 8, radius: 9 },
  templates: { ledgerline, 'margin-note': marginNote, bulletin },
  labels: { close: 'Dismiss' },
}
