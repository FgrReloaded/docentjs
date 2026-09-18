// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { isSafeUrl, renderBody, renderMedia } from './content'

function html(frag: DocumentFragment | HTMLElement | null): string {
  const div = document.createElement('div')
  if (frag) div.appendChild(frag)
  return div.innerHTML
}

describe('isSafeUrl', () => {
  it.each([
    ['https://a.com', true],
    ['http://a.com', true],
    ['mailto:x@y.z', true],
    ['/relative', true],
    ['#hash', true],
    ['javascript:alert(1)', false],
    ['JAVASCRIPT:alert(1)', false],
    ['data:text/html,x', false],
    ['vbscript:x', false],
  ])('%s → %s', (url, ok) => {
    expect(isSafeUrl(url)).toBe(ok)
  })
})

describe('renderBody', () => {
  it('renders plain text literally, never as HTML', () => {
    expect(html(renderBody(document, '<b>hi</b> **no**'))).toBe(
      '<p>&lt;b&gt;hi&lt;/b&gt; **no**</p>',
    )
  })

  it('splits paragraphs and line breaks', () => {
    expect(html(renderBody(document, 'a\nb\n\nc'))).toBe('<p>a<br>b</p><p>c</p>')
  })

  it('renders the markdown subset', () => {
    const out = html(
      renderBody(document, 'Go **bold** and *soft* with `code` [here](https://x.y)', 'markdown'),
    )
    expect(out).toBe(
      '<p>Go <strong>bold</strong> and <em>soft</em> with <code>code</code> ' +
        '<a href="https://x.y" target="_blank" rel="noopener noreferrer">here</a></p>',
    )
  })

  it('drops unsafe links but keeps their text, and never injects HTML', () => {
    expect(html(renderBody(document, '[x](javascript:alert(1)) <img src=x>', 'markdown'))).toBe(
      '<p>x &lt;img src=x&gt;</p>',
    )
  })

  it('nests inline formatting', () => {
    expect(html(renderBody(document, '**bold *and* more**', 'markdown'))).toBe(
      '<p><strong>bold <em>and</em> more</strong></p>',
    )
  })
})

describe('renderMedia', () => {
  it('renders images and videos', () => {
    expect(html(renderMedia(document, { type: 'image', src: '/a.png', alt: 'A' }))).toBe(
      '<img src="/a.png" alt="A" loading="lazy">',
    )
    const video = renderMedia(document, { type: 'video', src: '/v.mp4' })
    expect(video?.tagName).toBe('VIDEO')
    expect((video as HTMLVideoElement).controls).toBe(true)
  })

  it('refuses unsafe sources', () => {
    expect(renderMedia(document, { type: 'image', src: 'javascript:x' })).toBeNull()
  })
})
