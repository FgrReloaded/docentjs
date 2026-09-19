/**
 * Theme tokens → CSS custom properties, plus the slot and template contracts
 * that let apps, framework adapters and (later) the visual builder customise
 * the popover without forking the renderer.
 */

import type {
  ArrowStyle,
  OverlayOptions,
  RenderContext,
  SpotlightOptions,
  Theme,
} from '@docentjs/core'

/** Token → CSS custom property (without the `--docent-` prefix). */
export const THEME_VARS: Record<keyof Theme, string> = {
  background: 'bg',
  foreground: 'fg',
  muted: 'muted',
  accent: 'accent',
  accentForeground: 'accent-fg',
  radius: 'radius',
  shadow: 'shadow',
  font: 'font',
  width: 'width',
  overlay: 'overlay',
  overlayOpacity: 'overlay-opacity',
  duration: 'duration',
  zIndex: 'z',
  connector: 'connector',
  ring: 'ring',
}

/** Write theme tokens as inline custom properties on an element. Clears unset ones. */
export function applyTheme(el: HTMLElement, theme: Theme | undefined): void {
  for (const key of Object.keys(THEME_VARS) as Array<keyof Theme>) {
    const value = theme?.[key]
    const prop = `--docent-${THEME_VARS[key]}`
    if (value === undefined) el.style.removeProperty(prop)
    else el.style.setProperty(prop, value)
  }
}

export function mergeThemes(...themes: Array<Theme | undefined>): Theme {
  return Object.assign({}, ...themes.filter(Boolean)) as Theme
}

// ---------------------------------------------------------------------------
// Slots
// ---------------------------------------------------------------------------

/**
 * Regions of the built-in popover that can be replaced. Custom content is
 * projected through native Shadow DOM slots, so it lives in the page's DOM
 * and keeps the page's CSS and framework behaviour.
 */
export type SlotName =
  | 'header'
  | 'title'
  | 'close'
  | 'body'
  | 'media'
  | 'footer'
  | 'progress'
  | 'buttons'

/**
 * What a slot renderer returns:
 * - a `Node` replaces the region,
 * - a string replaces it with text,
 * - `null` removes the region,
 * - `undefined` keeps the default.
 */
export type SlotContent = Node | string | null | undefined

export type SlotRenderer = (ctx: RenderContext, doc: Document) => SlotContent

export type PopoverSlots = Partial<Record<SlotName, SlotRenderer>>

// ---------------------------------------------------------------------------
// Templates and headless mode
// ---------------------------------------------------------------------------

/**
 * A named bundle of theme, slots and CSS. Tours pick one by name through
 * `options.template`, which keeps the JSON builder-friendly while the code
 * that defines the template stays in the app.
 */
export interface PopoverTemplate {
  theme?: Theme
  slots?: PopoverSlots
  /** Arrow style for tours using this template. */
  arrow?: ArrowStyle
  spotlight?: SpotlightOptions
  overlay?: OverlayOptions
  /** Extra CSS injected into the shadow root while this template is active. */
  css?: string
}

/**
 * Replace the whole popover. The renderer still draws the overlay and
 * spotlight, positions `container`, sets `data-side` and `--docent-arrow`
 * on it, and handles keyboard, focus and state. You draw everything inside.
 */
export interface HeadlessPopover {
  /** Render the step into `container`. Return a cleanup to run before the next step. */
  render(ctx: RenderContext, container: HTMLElement): undefined | (() => void)
}
