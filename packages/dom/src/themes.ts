/**
 * Built-in theme presets. Import from `@docentjs/dom/themes` so they only
 * ship when used. Colors are OKLCH, tinted toward the Docent hue (285).
 */

import type { Theme } from '@docentjs/core'

/** The default look, spelled out: ink on paper. */
export const light: Theme = {
  background: 'oklch(99.4% 0.003 285)',
  foreground: 'oklch(23% 0.018 285)',
  muted: 'oklch(52% 0.014 285)',
  accent: 'oklch(26% 0.02 285)',
  accentForeground: 'oklch(98.5% 0.004 285)',
}

/** Opt-in dark surface for dark products. The accent inverts to paper. */
export const dark: Theme = {
  background: 'oklch(24% 0.014 285)',
  foreground: 'oklch(95% 0.006 285)',
  muted: 'oklch(72% 0.012 285)',
  accent: 'oklch(95% 0.006 285)',
  accentForeground: 'oklch(22% 0.016 285)',
  overlay: 'oklch(12% 0.012 285)',
  overlayOpacity: '0.62',
}

/** Flatter and tighter: smaller radius, lighter shadow, softer scrim. */
export const minimal: Theme = {
  radius: '8px',
  shadow: '0 1px 2px oklch(23% 0.02 285 / 0.08), 0 6px 16px -6px oklch(23% 0.02 285 / 0.14)',
  overlayOpacity: '0.36',
}

/** Maximum legibility for accessibility-first products. */
export const contrast: Theme = {
  background: 'oklch(13% 0.01 285)',
  foreground: 'oklch(99% 0.002 285)',
  muted: 'oklch(88% 0.008 285)',
  accent: 'oklch(90% 0.18 100)',
  accentForeground: 'oklch(13% 0.01 285)',
  overlayOpacity: '0.8',
}

export const presets: Record<string, Theme> = { light, dark, minimal, contrast }
