/**
 * WCAG contrast for any CSS color the browser understands (hex, rgb, oklch, …),
 * by letting a canvas resolve it to sRGB.
 */

let ctx: CanvasRenderingContext2D | null | undefined

function context(): CanvasRenderingContext2D | null {
  if (ctx !== undefined) return ctx
  try {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    ctx = canvas.getContext('2d', { willReadFrequently: true })
  } catch {
    ctx = null
  }
  return ctx
}

/** sRGB 0–255 channels, or null when the color cannot be resolved. */
export function toRgb(color: string): [number, number, number] | null {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())
  if (hex?.[1]) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join('') : hex[1]
    return [0, 2, 4].map((i) => Number.parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
  }
  const c = context()
  if (!c) return null
  c.clearRect(0, 0, 1, 1)
  c.fillStyle = '#010203'
  c.fillStyle = color
  c.fillRect(0, 0, 1, 1)
  const d = c.getImageData(0, 0, 1, 1).data
  return [d[0] ?? 0, d[1] ?? 0, d[2] ?? 0]
}

export function toHex(color: string): string | null {
  const rgb = toRgb(color)
  return rgb ? `#${rgb.map((n) => n.toString(16).padStart(2, '0')).join('')}` : null
}

function luminance([r, g, b]: [number, number, number]): number {
  const lin = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** Contrast ratio 1–21, or null when either color cannot be resolved. */
export function contrastRatio(a: string, b: string): number | null {
  const x = toRgb(a)
  const y = toRgb(b)
  if (!x || !y) return null
  const [hi, lo] = [luminance(x), luminance(y)].sort((m, n) => n - m) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}
