/**
 * Builds the popover DOM for a step. Every region is wrapped in a named
 * `<slot>` whose fallback is the default UI, so custom content projected
 * from the light DOM replaces it without touching the rest.
 */

import type { Labels, RenderContext } from '@docentjs/core'
import { renderBody, renderMedia } from './content'
import type { PopoverSlots, SlotName } from './theme'

export const DEFAULT_LABELS: Required<Labels> = {
  next: 'Next',
  back: 'Back',
  skip: 'Skip',
  done: 'Done',
  close: 'Close',
  progress: '{current} of {total}',
}

export interface PopoverParts {
  el: HTMLDivElement
  arrow: HTMLDivElement
  /** Element to focus when the step opens. */
  initialFocus: HTMLElement
  /** Light-DOM nodes to append to the shadow host so they project into slots. */
  slotted: Element[]
}

function h<K extends keyof HTMLElementTagNameMap>(
  doc: Document,
  tag: K,
  className: string,
  part: string,
): HTMLElementTagNameMap[K] {
  const el = doc.createElement(tag)
  el.className = className
  el.setAttribute('part', part)
  return el
}

function slot(doc: Document, name: SlotName, fallback?: Node): HTMLSlotElement {
  const s = doc.createElement('slot')
  s.name = name
  if (fallback) s.appendChild(fallback)
  return s
}

const SVG_NS = 'http://www.w3.org/2000/svg'

/** A 14px stroked X, drawn rather than typed so it centers optically in any font. */
function closeIcon(doc: Document): SVGSVGElement {
  const svg = doc.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('viewBox', '0 0 14 14')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('fill', 'none')
  const path = doc.createElementNS(SVG_NS, 'path')
  path.setAttribute('d', 'M3.5 3.5l7 7m0-7l-7 7')
  path.setAttribute('stroke', 'currentColor')
  path.setAttribute('stroke-width', '1.6')
  path.setAttribute('stroke-linecap', 'round')
  svg.appendChild(path)
  return svg
}

/** A small forward arrow for the primary action, so direction reads at a glance. */
function arrowIcon(doc: Document): SVGSVGElement {
  const svg = doc.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('viewBox', '0 0 12 12')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('class', 'icon')
  const path = doc.createElementNS(SVG_NS, 'path')
  path.setAttribute('d', 'M2.5 6h7m-3-3l3 3-3 3')
  path.setAttribute('stroke', 'currentColor')
  path.setAttribute('stroke-width', '1.5')
  path.setAttribute('stroke-linecap', 'round')
  path.setAttribute('stroke-linejoin', 'round')
  svg.appendChild(path)
  return svg
}

export function formatProgress(template: string, current: number, total: number): string {
  return template.replace('{current}', String(current)).replace('{total}', String(total))
}

/**
 * Resolve slot overrides into light-DOM elements carrying `slot="<name>"`.
 * A `null` result projects an empty element, which suppresses the fallback.
 */
export function resolveSlots(doc: Document, slots: PopoverSlots, ctx: RenderContext): Element[] {
  const out: Element[] = []
  for (const [name, render] of Object.entries(slots) as Array<[SlotName, PopoverSlots[SlotName]]>) {
    const content = render?.(ctx, doc)
    if (content === undefined) continue
    let el: Element
    if (content === null) el = doc.createElement('span')
    else if (typeof content === 'string') {
      el = doc.createElement('span')
      el.textContent = content
    } else if (content instanceof Element) el = content
    else {
      el = doc.createElement('div')
      el.appendChild(content)
    }
    el.setAttribute('slot', name)
    out.push(el)
  }
  return out
}

export function buildPopover(
  doc: Document,
  ctx: RenderContext,
  labels: Labels = {},
  slots: PopoverSlots = {},
): PopoverParts {
  const { step, tour, actions } = ctx
  const options = tour.options ?? {}
  const text: Required<Labels> = { ...DEFAULT_LABELS, ...options.labels, ...labels }
  const buttons = step.buttons ?? {}
  const id = `docent-${tour.id}-${step.id}`

  const el = h(doc, 'div', 'popover', 'popover')
  el.setAttribute('role', 'dialog')
  el.tabIndex = -1

  const arrow = h(doc, 'div', 'arrow', 'arrow')
  el.appendChild(arrow)

  // Header: title + close
  const header = h(doc, 'div', 'header', 'header')
  let titleNode: Node | undefined
  if (step.title) {
    const title = h(doc, 'h2', 'title', 'title')
    title.id = `${id}-title`
    title.textContent = step.title
    titleNode = title
    el.setAttribute('aria-labelledby', title.id)
  }
  header.appendChild(slot(doc, 'title', titleNode))
  let closeNode: Node | undefined
  if (options.allowClose !== false && buttons.close !== false) {
    const close = h(doc, 'button', 'close', 'close')
    close.type = 'button'
    close.setAttribute('aria-label', text.close)
    close.appendChild(closeIcon(doc))
    close.addEventListener('click', () => actions.skip())
    closeNode = close
  }
  header.appendChild(slot(doc, 'close', closeNode))
  el.appendChild(slot(doc, 'header', header))

  // Body
  let bodyNode: Node | undefined
  if (step.body) {
    const body = h(doc, 'div', 'body', 'body')
    body.id = `${id}-body`
    body.appendChild(renderBody(doc, step.body, step.format))
    bodyNode = body
    el.setAttribute('aria-describedby', body.id)
  }
  el.appendChild(slot(doc, 'body', bodyNode))

  // Media
  let mediaNode: Node | undefined
  if (step.media) {
    const media = renderMedia(doc, step.media)
    if (media) {
      const wrap = h(doc, 'div', 'media', 'media')
      wrap.appendChild(media)
      mediaNode = wrap
    }
  }
  el.appendChild(slot(doc, 'media', mediaNode))

  // Footer: progress + buttons
  const footer = h(doc, 'div', 'footer', 'footer')
  const progress = h(doc, 'div', 'progress', 'progress')
  if (options.showProgress !== false) {
    // A slim meter plus the count; the meter is decorative, the text is read out.
    const meter = h(doc, 'span', 'meter', 'meter')
    meter.setAttribute('aria-hidden', 'true')
    progress.style.setProperty('--docent-step', String(ctx.progress.current))
    progress.style.setProperty('--docent-steps', String(Math.max(1, ctx.progress.total)))
    const count = h(doc, 'span', 'count', 'count')
    count.textContent = formatProgress(text.progress, ctx.progress.current, ctx.progress.total)
    progress.append(meter, count)
  }
  footer.appendChild(slot(doc, 'progress', progress))

  const group = h(doc, 'div', 'buttons', 'buttons')
  let initialFocus: HTMLElement = el
  const button = (label: string, part: string, primary: boolean, onClick: () => void) => {
    const b = h(doc, 'button', primary ? 'button primary' : 'button', `button ${part}`)
    b.type = 'button'
    b.textContent = label
    b.addEventListener('click', onClick)
    group.appendChild(b)
    return b
  }
  // Reading order matches visual order: quiet Skip, then Back, then the primary action.
  if (buttons.skip !== false && !ctx.isLast) button(text.skip, 'button-skip', false, actions.skip)
  if (buttons.back !== false && ctx.canGoBack) button(text.back, 'button-back', false, actions.back)
  if (buttons.next !== false) {
    initialFocus = button(ctx.isLast ? text.done : text.next, 'button-next', true, actions.next)
    if (!ctx.isLast) initialFocus.appendChild(arrowIcon(doc))
  }
  footer.appendChild(slot(doc, 'buttons', group))
  el.appendChild(slot(doc, 'footer', footer))

  const slotted = resolveSlots(doc, slots, ctx)
  if (
    slotted.some((s) => s.getAttribute('slot') === 'buttons' || s.getAttribute('slot') === 'footer')
  ) {
    initialFocus = el
  }
  return { el, arrow, initialFocus, slotted }
}

/** Wrapper used in headless mode: a positioned shell that projects the app's own popover. */
export function buildHeadlessShell(doc: Document): { el: HTMLDivElement; arrow: HTMLDivElement } {
  const el = h(doc, 'div', 'popover headless', 'popover')
  const arrow = h(doc, 'div', 'arrow', 'arrow')
  arrow.hidden = true
  el.appendChild(arrow)
  const s = doc.createElement('slot')
  s.name = 'popover'
  el.appendChild(s)
  return { el, arrow }
}
