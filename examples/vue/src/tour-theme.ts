/**
 * Cinder's house style: brand tokens plus two named themes the tour JSON
 * selects with `options.template`. All data — nothing here builds DOM.
 */

import type { DocentTheme, DomRendererOptions, Theme } from '@docentjs/vue'

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
  padding: '16px 16px 12px',
  font: "'Familjen Grotesk', ui-sans-serif, system-ui, sans-serif",
  shadow: '0 24px 56px -24px oklch(8% 0.02 60 / 0.95)',
  overlay: 'oklch(12% 0.014 60)',
  overlayOpacity: 0.66,
  duration: 200,
}

/** Custom properties cross the shadow boundary, so the page's scale works by name. */
const type = `
  .title { font-size: 1.125rem; letter-spacing: -0.015em; }
  .eyebrow { font-family: var(--face-mono); letter-spacing: 0.12em; color: var(--ember); }
  .count { font-family: var(--face-mono); letter-spacing: 0.06em; }
`

/** The console look: monospace counter, hard segments, square-ish corners. */
const cinder: DocentTheme = {
  theme: brand,
  eyebrow: '{tour}',
  progress: 'ticks',
  count: '{current2}/{total}',
  spotlight: { ring: 'hairline', padding: 8, radius: 8, animate: true },
  css: `
    ${type}
    .body { margin-top: 8px; }
    .footer { margin-top: 16px; }
    .button { border-radius: 6px; }
    .marks { flex: 1; }
    .marks i { flex: 1; max-width: none; height: 3px; border-radius: 1px; }
    .marks i[data-done] { background: var(--ember); }
  `,
}

/** For a tip that must not stop the page: no scrim, a pulsing ring, a dotted pin. */
const signal: DocentTheme = {
  theme: { ...brand, width: 300, padding: '14px' },
  overlay: { style: 'none' },
  spotlight: { ring: 'pulse', padding: 6, radius: 8 },
  arrow: 'pin',
  eyebrow: '{tour}',
  progress: 'none',
  css: `${type} .footer { margin-top: 12px; }`,
}

export const rendererDefaults: DomRendererOptions = {
  appearance: 'dark',
  gap: 12,
  templates: { cinder, signal },
  labels: { skip: 'Dismiss', close: 'Dismiss' },
}
