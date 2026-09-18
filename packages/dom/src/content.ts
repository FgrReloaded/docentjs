/**
 * Turns step text into DOM nodes without ever using innerHTML. Supports a
 * small, safe inline Markdown subset: **bold**, *italic*, `code`, [links](url),
 * paragraphs separated by blank lines and line breaks on single newlines.
 */

import type { Media } from '@docentjs/core'

const SAFE_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:'])

export function isSafeUrl(url: string): boolean {
  const match = /^([a-z][a-z0-9+.-]*):/i.exec(url.trim())
  if (!match) return true // relative
  return SAFE_SCHEMES.has(`${match[1]?.toLowerCase()}:`)
}

const INLINE = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(\[(.+?)\]\(((?:[^()\s]|\([^()]*\))+)\))/g

function appendInline(doc: Document, parent: Node, text: string): void {
  let last = 0
  for (const m of text.matchAll(INLINE)) {
    const index = m.index ?? 0
    if (index > last) parent.appendChild(doc.createTextNode(text.slice(last, index)))
    if (m[2] !== undefined) {
      const el = doc.createElement('strong')
      appendInline(doc, el, m[2])
      parent.appendChild(el)
    } else if (m[4] !== undefined) {
      const el = doc.createElement('em')
      appendInline(doc, el, m[4])
      parent.appendChild(el)
    } else if (m[6] !== undefined) {
      const el = doc.createElement('code')
      el.textContent = m[6]
      parent.appendChild(el)
    } else if (m[8] !== undefined && m[9] !== undefined) {
      if (isSafeUrl(m[9])) {
        const a = doc.createElement('a')
        a.href = m[9]
        a.target = '_blank'
        a.rel = 'noopener noreferrer'
        appendInline(doc, a, m[8])
        parent.appendChild(a)
      } else {
        parent.appendChild(doc.createTextNode(m[8]))
      }
    }
    last = index + m[0].length
  }
  if (last < text.length) parent.appendChild(doc.createTextNode(text.slice(last)))
}

function appendLines(doc: Document, parent: Node, text: string, inline: boolean): void {
  const lines = text.split('\n')
  lines.forEach((line, i) => {
    if (i > 0) parent.appendChild(doc.createElement('br'))
    if (inline) appendInline(doc, parent, line)
    else parent.appendChild(doc.createTextNode(line))
  })
}

export function renderBody(
  doc: Document,
  body: string,
  format: 'text' | 'markdown' = 'text',
): DocumentFragment {
  const frag = doc.createDocumentFragment()
  for (const para of body.split(/\n{2,}/)) {
    if (!para.trim()) continue
    const p = doc.createElement('p')
    appendLines(doc, p, para, format === 'markdown')
    frag.appendChild(p)
  }
  return frag
}

export function renderMedia(doc: Document, media: Media): HTMLElement | null {
  if (!isSafeUrl(media.src)) return null
  if (media.type === 'image') {
    const img = doc.createElement('img')
    img.src = media.src
    img.alt = media.alt ?? ''
    img.setAttribute('loading', 'lazy')
    return img
  }
  const video = doc.createElement('video')
  video.src = media.src
  video.controls = true
  video.playsInline = true
  if (media.alt) video.setAttribute('aria-label', media.alt)
  return video
}
