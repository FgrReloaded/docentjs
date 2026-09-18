/**
 * Built-in theme presets. Import from `@docentjs/dom/themes` so they only
 * ship when used.
 */

import type { Theme } from '@docentjs/core'

export const light: Theme = {
  background: '#ffffff',
  foreground: '#111827',
  muted: '#6b7280',
  accent: '#2563eb',
  accentForeground: '#ffffff',
}

export const dark: Theme = {
  background: '#1f2937',
  foreground: '#f9fafb',
  muted: '#9ca3af',
  accent: '#60a5fa',
  accentForeground: '#0b1220',
}

/** Flat, borderless, tighter radius. */
export const minimal: Theme = {
  radius: '6px',
  shadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
  overlayOpacity: '0.35',
}

/** Higher contrast for accessibility-first products. */
export const contrast: Theme = {
  background: '#000000',
  foreground: '#ffffff',
  muted: '#d1d5db',
  accent: '#ffd400',
  accentForeground: '#000000',
  overlayOpacity: '0.8',
}

export const presets: Record<string, Theme> = { light, dark, minimal, contrast }
