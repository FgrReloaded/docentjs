/**
 * Built-in looks: a whole visual treatment under one name, so a tour can say
 * `template: 'hint'` instead of setting an overlay, an arrow and a ring.
 *
 * They are ordinary templates. An app that registers a template with the same
 * name replaces the built-in one.
 */

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
