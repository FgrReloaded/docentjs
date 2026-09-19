/** @jsxImportSource preact */
/**
 * Mounts the devtools panel in its own shadow root, so page styles cannot
 * reach it and it cannot affect the page.
 */

import type { Docent } from '@docentjs/core'
import { render } from 'preact'
import { App } from './App'
import { pickElement } from './picker'
import { createStore } from './store'
import { OUTLINE_STYLE, STYLES } from './styles'

export interface MountOptions {
  /** Start with the panel open. Default: remembered, else closed. */
  open?: boolean
  /** Keyboard shortcut to toggle the panel. Default Alt+Shift+D. Set false to disable. */
  shortcut?:
    | false
    | { key: string; altKey?: boolean; shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean }
  /** Document to mount into. */
  document?: Document
}

/**
 * Mount the devtools panel for a tour manager. Returns a function that removes
 * it. Load it only in development:
 *
 * ```ts
 * if (import.meta.env.DEV) import('@docentjs/devtools').then((d) => d.mount(docent))
 * ```
 */
export function mount(docent: Docent, options: MountOptions = {}): () => void {
  const doc = options.document ?? document
  const host = doc.createElement('div')
  host.setAttribute('data-docent-devtools', '')
  host.setAttribute('data-docent-ignore-keys', '')
  const shadow = host.attachShadow({ mode: 'open' })
  const style = doc.createElement('style')
  style.textContent = STYLES
  const root = doc.createElement('div')
  root.className = 'root'
  shadow.append(style, root)
  doc.body.appendChild(host)

  // The outline lives in the page so it can sit over any element.
  const outline = doc.createElement('div')
  outline.setAttribute('data-docent-devtools-highlight', '')
  outline.style.cssText = `${OUTLINE_STYLE};display:none`
  doc.body.appendChild(outline)
  const highlight = (el: Element | null) => {
    if (!el) {
      outline.style.display = 'none'
      return
    }
    const r = el.getBoundingClientRect()
    Object.assign(outline.style, {
      display: 'block',
      left: `${r.left - 3}px`,
      top: `${r.top - 3}px`,
      width: `${r.width + 6}px`,
      height: `${r.height + 6}px`,
    })
  }

  const store = createStore(docent, {
    ...(options.open === undefined ? {} : { open: options.open }),
    highlight,
    pick: () => pickElement({ doc, ignore: () => [host, outline], highlight }),
  })
  render(<App store={store} />, root)

  const shortcut =
    options.shortcut === undefined ? { key: 'D', altKey: true, shiftKey: true } : options.shortcut
  const win = doc.defaultView
  const onKey = (e: KeyboardEvent) => {
    if (!shortcut) return
    if (
      e.key.toLowerCase() === shortcut.key.toLowerCase() &&
      !!e.altKey === !!shortcut.altKey &&
      !!e.shiftKey === !!shortcut.shiftKey &&
      !!e.ctrlKey === !!shortcut.ctrlKey &&
      !!e.metaKey === !!shortcut.metaKey
    ) {
      e.preventDefault()
      store.open.value = !store.open.value
    }
  }
  win?.addEventListener('keydown', onKey)

  return () => {
    win?.removeEventListener('keydown', onKey)
    render(null, root)
    store.destroy()
    host.remove()
    outline.remove()
  }
}
