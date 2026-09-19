/**
 * Page-level element picker: a transparent layer that outlines whatever is
 * under the cursor and resolves with the clicked element.
 */

import { targetCandidates } from '../selectors'

export interface PickerOptions {
  doc: Document
  /** Elements that must never be picked (devtools, the tour, the outline). */
  ignore: () => Element[]
  highlight: (el: Element | null) => void
}

export function pickElement({ doc, ignore, highlight }: PickerOptions): Promise<Element | null> {
  return new Promise((resolve) => {
    const layer = doc.createElement('div')
    layer.setAttribute('data-docent-picker', '')
    layer.style.cssText =
      'position:fixed;inset:0;z-index:2147483645;cursor:crosshair;background:transparent'
    const label = doc.createElement('div')
    label.style.cssText =
      'position:fixed;z-index:2147483646;pointer-events:none;padding:4px 8px;border-radius:6px;font:11px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;background:oklch(20% 0.02 285);color:oklch(96% 0.005 285);box-shadow:0 4px 14px oklch(20% 0.02 285 / .3);max-width:360px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:none'
    const hint = doc.createElement('div')
    hint.textContent = 'Click an element to use it as the target · Esc to cancel'
    hint.style.cssText =
      'position:fixed;left:50%;top:12px;translate:-50% 0;z-index:2147483646;pointer-events:none;padding:6px 12px;border-radius:999px;font:12px/1.4 system-ui,sans-serif;background:oklch(20% 0.02 285);color:oklch(96% 0.005 285)'

    // Hide the running tour so its overlay does not cover what you want to pick.
    const tourHost = doc.querySelector<HTMLElement>('[data-docent-host]')
    const previousVisibility = tourHost?.style.visibility ?? ''
    if (tourHost) tourHost.style.visibility = 'hidden'

    let current: Element | null = null
    const under = (x: number, y: number): Element | null => {
      const skip = new Set<Element>([layer, label, hint, ...ignore()])
      return (
        doc
          .elementsFromPoint(x, y)
          .find((el) => ![...skip].some((s) => s === el || s.contains(el))) ?? null
      )
    }
    const onMove = (e: MouseEvent) => {
      current = under(e.clientX, e.clientY)
      highlight(current)
      if (!current) {
        label.style.display = 'none'
        return
      }
      const best = targetCandidates(current)[0]
      label.textContent = best
        ? best.kind === 'name'
          ? `name: ${best.value}`
          : best.value
        : current.tagName.toLowerCase()
      label.style.display = 'block'
      const r = current.getBoundingClientRect()
      label.style.left = `${Math.max(8, r.left)}px`
      label.style.top = `${r.top > 34 ? r.top - 30 : r.bottom + 8}px`
    }
    const finish = (el: Element | null) => {
      layer.remove()
      label.remove()
      hint.remove()
      highlight(null)
      if (tourHost) tourHost.style.visibility = previousVisibility
      doc.removeEventListener('keydown', onKey, true)
      resolve(el)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopPropagation()
      finish(null)
    }
    layer.addEventListener('mousemove', onMove)
    layer.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      finish(current ?? under(e.clientX, e.clientY))
    })
    doc.addEventListener('keydown', onKey, true)
    doc.body.append(layer, label, hint)
  })
}
