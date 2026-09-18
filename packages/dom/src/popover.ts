/**
 * Builds the popover DOM for a step from the render context.
 */

import type { Labels, RenderContext } from '@docentjs/core'
import { renderBody, renderMedia } from './content'

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

export function formatProgress(template: string, current: number, total: number): string {
  return template.replace('{current}', String(current)).replace('{total}', String(total))
}

export function buildPopover(doc: Document, ctx: RenderContext, labels: Labels = {}): PopoverParts {
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

  const header = h(doc, 'div', 'header', 'header')
  if (step.title) {
    const title = h(doc, 'h2', 'title', 'title')
    title.id = `${id}-title`
    title.textContent = step.title
    header.appendChild(title)
    el.setAttribute('aria-labelledby', title.id)
  }
  if (options.allowClose !== false && buttons.close !== false) {
    const close = h(doc, 'button', 'close', 'close')
    close.type = 'button'
    close.setAttribute('aria-label', text.close)
    close.textContent = '×'
    close.addEventListener('click', () => actions.skip())
    header.appendChild(close)
  }
  if (header.childElementCount > 0) el.appendChild(header)

  if (step.body) {
    const body = h(doc, 'div', 'body', 'body')
    body.id = `${id}-body`
    body.appendChild(renderBody(doc, step.body, step.format))
    el.appendChild(body)
    el.setAttribute('aria-describedby', body.id)
  }

  if (step.media) {
    const media = renderMedia(doc, step.media)
    if (media) {
      const wrap = h(doc, 'div', 'media', 'media')
      wrap.appendChild(media)
      el.appendChild(wrap)
    }
  }

  const footer = h(doc, 'div', 'footer', 'footer')
  const progress = h(doc, 'div', 'progress', 'progress')
  if (options.showProgress !== false) {
    progress.textContent = formatProgress(text.progress, ctx.progress.current, ctx.progress.total)
  }
  footer.appendChild(progress)

  let initialFocus: HTMLElement = el
  const button = (label: string, part: string, primary: boolean, onClick: () => void) => {
    const b = h(doc, 'button', primary ? 'button primary' : 'button', `button ${part}`)
    b.type = 'button'
    b.textContent = label
    b.addEventListener('click', onClick)
    footer.appendChild(b)
    return b
  }
  if (buttons.back !== false && ctx.canGoBack) button(text.back, 'button-back', false, actions.back)
  if (buttons.skip !== false && !ctx.isLast) button(text.skip, 'button-skip', false, actions.skip)
  if (buttons.next !== false) {
    initialFocus = button(ctx.isLast ? text.done : text.next, 'button-next', true, actions.next)
  }
  el.appendChild(footer)

  return { el, arrow, initialFocus }
}
