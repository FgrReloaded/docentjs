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
  ThemeName,
  ThemeSpec,
  ThemeValue,
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

/** Tokens that take a unit when given as a number. */
const UNITS: Partial<Record<keyof Theme, string>> = { radius: 'px', width: 'px', duration: 'ms' }

/** `12` becomes `12px`, `220` becomes `220ms`, strings are passed through. */
function cssValue(key: keyof Theme, value: ThemeValue): string {
  return typeof value === 'number' ? `${value}${UNITS[key] ?? ''}` : value
}

/** Write theme tokens as inline custom properties on an element. Clears unset ones. */
export function applyTheme(el: HTMLElement, theme: Theme | undefined): void {
  for (const key of Object.keys(THEME_VARS) as Array<keyof Theme>) {
    const value = theme?.[key]
    const prop = `--docent-${THEME_VARS[key]}`
    if (value === undefined) el.style.removeProperty(prop)
    else el.style.setProperty(prop, cssValue(key, value))
  }
  // A brand accent with no text colour of its own: pick the readable one.
  if (theme?.accent !== undefined && theme.accentForeground === undefined) {
    const light = isLightColor(el, cssValue('accent', theme.accent))
    if (light !== undefined) {
      el.style.setProperty('--docent-accent-fg', light ? 'var(--docent-fg)' : 'var(--docent-bg)')
    }
  }
}

/**
 * Is this colour light enough to need dark text on it? Resolves the colour
 * through the browser, so any CSS colour works. Undefined when it cannot tell.
 */
function isLightColor(el: HTMLElement, color: string): boolean | undefined {
  const view = el.ownerDocument.defaultView
  if (!view) return undefined
  const previous = el.style.color
  el.style.color = color
  const computed = view.getComputedStyle(el).color
  el.style.color = previous
  const rgb = computed.match(/^(?:rgba?|color\(srgb)[( ]([^)]+)\)?/)
  if (rgb?.[1]) {
    const [r = 0, g = 0, b = 0] = rgb[1]
      .split(/[\s,/]+/)
      .slice(0, 3)
      .map((n) => (n.endsWith('%') ? (Number.parseFloat(n) / 100) * 255 : Number.parseFloat(n)))
    const scale = computed.startsWith('color(') ? 255 : 1
    return (0.2126 * r * scale + 0.7152 * g * scale + 0.0722 * b * scale) / 255 > 0.55
  }
  const ok = computed.match(/^oklch\(\s*([\d.]+)(%?)/)
  if (ok?.[1]) {
    const l = Number.parseFloat(ok[1]) / (ok[2] === '%' ? 100 : 1)
    return l > 0.62
  }
  return undefined
}

export function mergeThemes(...themes: Array<Theme | undefined>): Theme {
  return Object.assign({}, ...themes.filter(Boolean)) as Theme
}

/**
 * Layer one theme over another when either may be a preset name. Used by the
 * framework adapters to merge a provider's defaults with a local theme.
 */
export function mergeThemeSpecs(
  base: ThemeSpec | undefined,
  override: ThemeSpec | undefined,
): ThemeSpec | undefined {
  if (base === undefined) return override
  if (override === undefined) return base
  const first = typeof base === 'string' ? { preset: base } : base
  const second = typeof override === 'string' ? { preset: override } : override
  return { ...first, ...second }
}

/** `{ theme }` when there is one, or nothing, for spreading into options. */
export function themeOption(theme: ThemeSpec | undefined): { theme?: ThemeSpec } {
  return theme === undefined ? {} : { theme }
}

/** Tokens of the built-in presets, loaded only when a theme names one. */
export type ThemePresets = Record<ThemeName, Theme>

/** True when this theme cannot be resolved without the built-in presets. */
export function needsPresets(spec: ThemeSpec | undefined): boolean {
  return typeof spec === 'string' || (!!spec && typeof spec === 'object' && 'preset' in spec)
}

/** A preset name, tokens, or a preset with tokens on top, flattened to tokens. */
export function resolveTheme(
  spec: ThemeSpec | undefined,
  presets: ThemePresets | undefined,
): Theme | undefined {
  if (spec === undefined) return undefined
  if (typeof spec === 'string') return presets?.[spec]
  const { preset, ...tokens } = spec
  if (preset === undefined) return tokens
  return mergeThemes(presets?.[preset], tokens)
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
  theme?: ThemeSpec
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
