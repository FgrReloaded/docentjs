/**
 * Built-in looks: a whole visual treatment under one name, so a tour can say
 * `template: 'hint'` instead of setting an overlay, an arrow and a ring.
 *
 * They are ordinary templates. An app that registers a template with the same
 * name replaces the built-in one.
 */

import type { Tour } from '@docentjs/core'
import type { PopoverTemplate } from './theme'

export type LookName = 'spotlight' | 'hint' | 'announcement'

export const BUILT_IN_LOOKS: Record<LookName, PopoverTemplate> = {
  /** The default: a dimmed page, a soft cutout, a small caret. */
  spotlight: {},
  /**
   * A light touch for tips beside a feature: the page stays usable and
   * clickable, with a glowing ring and a drawn curve instead of a scrim.
   */
  hint: {
    overlay: { style: 'none' },
    spotlight: { ring: 'glow', padding: 6 },
    arrow: 'curve',
    theme: { width: 300 },
  },
  /**
   * For something to read rather than something to do: the page blurs away,
   * nothing points anywhere, and the card is wider.
   */
  announcement: {
    overlay: { style: 'blur', blur: 6 },
    spotlight: { ring: 'none', padding: 10 },
    arrow: 'none',
    theme: { width: 420 },
  },
}

/** Where templates come from: the renderer's options. */
export interface TemplateSources {
  template?: string | PopoverTemplate | undefined
  templates?: Record<string, PopoverTemplate> | undefined
}

/** The tour's template: one the app registered, a built-in look, or a theme handed over whole. */
export function templateFor(tour: Tour, sources: TemplateSources): PopoverTemplate | undefined {
  const chosen = tour.options?.template ?? sources.template
  if (chosen === undefined) return undefined
  if (typeof chosen !== 'string') return chosen
  return sources.templates?.[chosen] ?? BUILT_IN_LOOKS[chosen as LookName]
}
