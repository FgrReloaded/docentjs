import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import satori from 'satori'
import sharp from 'sharp'
import { OG_HEIGHT, OG_WIDTH } from './pages'

const ink = {
  bg: '#0e0e13',
  surface: '#14141a',
  raised: '#1b1b21',
  hairline: '#23232a',
  hairlineLight: '#2f2f37',
  text: '#f5f5f8',
  muted: '#bdbdc4',
  faint: '#8b8b94',
  accent: '#a495f0',
  accentHigh: '#d6d2fd',
  accentLow: '#2a244c',
}

const require = createRequire(import.meta.url)
const font = (spec: string) => readFile(require.resolve(spec))

let fonts: Promise<Parameters<typeof satori>[1]['fonts']> | undefined
function loadFonts() {
  fonts ??= Promise.all([
    font('@fontsource/spectral/files/spectral-latin-400-normal.woff'),
    font('@fontsource/spectral/files/spectral-latin-400-italic.woff'),
    font('@fontsource/schibsted-grotesk/files/schibsted-grotesk-latin-400-normal.woff'),
    font('@fontsource/schibsted-grotesk/files/schibsted-grotesk-latin-500-normal.woff'),
    font('@fontsource/fragment-mono/files/fragment-mono-latin-400-normal.woff'),
  ]).then(([serif, serifItalic, sans, sansMedium, mono]) => [
    { name: 'Spectral', data: serif, weight: 400, style: 'normal' },
    { name: 'Spectral', data: serifItalic, weight: 400, style: 'italic' },
    { name: 'Schibsted Grotesk', data: sans, weight: 400, style: 'normal' },
    { name: 'Schibsted Grotesk', data: sansMedium, weight: 500, style: 'normal' },
    { name: 'Fragment Mono', data: mono, weight: 400, style: 'normal' },
  ])
  return fonts
}

const mark = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" fill="none"><rect x="2.75" y="2.75" width="14.5" height="14.5" rx="4.25" stroke="#eeeef2" stroke-width="1.5"/><rect x="10" y="12" width="15.5" height="12.5" rx="3.5" fill="#a495f0"/><rect x="13" y="16" width="7.5" height="1.5" rx=".75" fill="#12111c"/><rect x="13" y="19.25" width="4.5" height="1.5" rx=".75" fill="#12111c" fill-opacity=".55"/></svg>',
)}`

// The popover's curved arrow, as in the home hero.
const connector = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 44" fill="none" stroke="#a495f0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M50 42 C 46 22, 30 10, 10 6"/><path d="M17 1.5 L9.5 6 L15.5 12"/></svg>',
)}`

type Node = { type: string; props: Record<string, unknown> }
const h = (type: string, style: Record<string, unknown>, children?: unknown): Node => ({
  type,
  props: { style, children },
})

function runs(title: string) {
  return title
    .split(/(<em>.*?<\/em>)/g)
    .filter(Boolean)
    .map((part) => {
      const em = part.startsWith('<em>')
      const text = part.replace(/<\/?em>/g, '')
      return h(
        'span',
        em ? { fontStyle: 'italic', color: ink.accent, whiteSpace: 'pre' } : { whiteSpace: 'pre' },
        text,
      )
    })
}

function motif() {
  return h(
    'div',
    { position: 'absolute', right: 72, top: 64, display: 'flex', width: 300, height: 170 },
    [
      h(
        'div',
        {
          position: 'absolute',
          left: 0,
          top: 0,
          width: 132,
          height: 44,
          borderRadius: 22,
          border: `1.5px solid ${ink.accent}`,
          boxShadow: `0 0 0 6px ${ink.accentLow}`,
          backgroundColor: ink.raised,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
        },
        [h('div', { width: 70, height: 7, borderRadius: 4, backgroundColor: ink.faint })],
      ),
      {
        type: 'img',
        props: {
          src: connector,
          width: 60,
          height: 44,
          style: { position: 'absolute', left: 104, top: 40 },
        },
      },
      h(
        'div',
        {
          position: 'absolute',
          left: 70,
          top: 88,
          width: 230,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          padding: '16px 18px',
          borderRadius: 12,
          backgroundColor: ink.raised,
          border: `1px solid ${ink.hairlineLight}`,
        },
        [
          h('div', { width: 150, height: 9, borderRadius: 5, backgroundColor: ink.muted }),
          h('div', { width: 190, height: 7, borderRadius: 4, backgroundColor: ink.hairlineLight }),
          h(
            'div',
            {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 4,
            },
            [
              h('div', {
                width: 44,
                height: 5,
                borderRadius: 3,
                backgroundColor: ink.hairlineLight,
              }),
              h('div', { width: 58, height: 22, borderRadius: 6, backgroundColor: ink.accent }),
            ],
          ),
        ],
      ),
    ],
  )
}

export interface Card {
  title: string
  description?: string
  eyebrow?: string
}

export async function renderCard({ title, description, eyebrow }: Card): Promise<Buffer> {
  const plain = title.replace(/<\/?em>/g, '')
  const titleSize = plain.length > 34 ? 64 : 76

  const tree = h(
    'div',
    {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '64px 72px',
      backgroundColor: ink.bg,
      color: ink.text,
      fontFamily: 'Schibsted Grotesk',
      position: 'relative',
    },
    [
      motif(),
      h('div', { display: 'flex', alignItems: 'center', gap: 14 }, [
        { type: 'img', props: { src: mark, width: 44, height: 44 } },
        h('span', { fontFamily: 'Spectral', fontSize: 34, letterSpacing: -0.5 }, 'Docent'),
      ]),
      h('div', { display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 900 }, [
        eyebrow
          ? h(
              'span',
              {
                fontFamily: 'Fragment Mono',
                fontSize: 20,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: ink.accent,
              },
              eyebrow,
            )
          : null,
        h(
          'div',
          {
            display: 'flex',
            flexWrap: 'wrap',
            fontFamily: 'Spectral',
            fontSize: titleSize,
            lineHeight: 1.08,
            letterSpacing: -1.5,
          },
          runs(title),
        ),
        description
          ? h(
              'p',
              {
                margin: 0,
                fontSize: 28,
                lineHeight: 1.45,
                color: ink.muted,
                lineClamp: 3,
                display: 'block',
              },
              description,
            )
          : null,
      ]),
      h(
        'div',
        {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 22,
          borderTop: `1px solid ${ink.hairline}`,
          fontFamily: 'Fragment Mono',
          fontSize: 20,
          color: ink.faint,
        },
        [h('span', {}, 'docentjs.dev'), h('span', {}, 'Guided product tours for the web')],
      ),
    ],
  )

  const svg = await satori(tree as never, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: await loadFonts(),
  })
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: false }).toBuffer()
}
