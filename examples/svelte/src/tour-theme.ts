/**
 * Pressroom's house style: brand tokens plus two named looks the tour JSON
 * selects with `options.template`. Data, apart from one slot: the folio is set
 * in roman numerals, which no field covers.
 */

import type { DomRendererOptions, PopoverTemplate, Theme } from '@docentjs/svelte'

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
  padding: '18px 20px 16px',
  font: "'Karla', ui-sans-serif, system-ui, sans-serif",
  // Print has no drop shadows; a hard offset does the work.
  shadow: '6px 6px 0 oklch(18% 0.012 60 / 0.09)',
  overlay: 'oklch(24% 0.03 60)',
  overlayOpacity: 0.46,
  duration: 190,
}

/** Custom properties cross the shadow boundary, so the page's faces work by name. */
const type = `
  .title { font-family: var(--face-head); font-size: 1.3125rem; line-height: 1.12; }
  .eyebrow { font-weight: 700; letter-spacing: 0.16em; color: var(--vermilion); }
`

/** The desk look: rules and caps rather than filled pills. */
const broadsheet: PopoverTemplate = {
  theme: brand,
  eyebrow: '{tour}',
  spotlight: { padding: 8, radius: 3, ring: 'hairline', animate: true },
  slots: {
    progress: (ctx, doc) => {
      const folio = doc.createElement('span')
      folio.className = 'tp-folio'
      folio.textContent = `${roman(ctx.progress.current)} of ${roman(ctx.progress.total)}`
      return folio
    },
  },
  css: `
    ${type}
    .body { margin-top: 8px; }
    .footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid color-mix(in oklch, var(--docent-fg) 14%, transparent); }
    .button {
      border: 0;
      padding: 0;
      background: none;
      font-size: var(--t-small);
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--docent-muted);
    }
    .button:hover { color: var(--docent-fg); }
    .button.primary {
      padding: 0 0 2px;
      background: none;
      border-bottom: 2px solid var(--docent-accent);
      border-radius: 0;
      color: var(--docent-fg);
    }
    .button.primary:hover { color: var(--docent-accent); }
    .button .icon { display: none; }
    /* A box around flat caps reads as an error; underline the focus instead. */
    .button:focus-visible { outline: 0; box-shadow: 0 2px 0 var(--docent-accent); }
  `,
}

/** A galley proof pinned to the page: no scrim, a dashed ring, a drawn stroke. */
const galley: PopoverTemplate = {
  theme: { ...brand, width: 300, padding: '14px 16px 12px' },
  overlay: { style: 'none' },
  spotlight: { ring: 'dashed', padding: 7, radius: 3 },
  arrow: 'sketch',
  eyebrow: '{tour}',
  progress: 'none',
  css: `${type} .footer { margin-top: 14px; }`,
}

export const rendererDefaults: DomRendererOptions = {
  theme: brand,
  gap: 14,
  templates: { broadsheet, galley },
  labels: { next: 'Next', back: 'Back', skip: 'Leave', done: 'Close', close: 'Close' },
}
