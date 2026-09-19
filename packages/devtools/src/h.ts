/** Tiny element helper. Never uses innerHTML: tour text is untrusted. */
type Child = Node | string | null | undefined | false
type Attrs = Record<string, string | number | boolean | undefined | ((e: Event) => void)>

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue
    if (typeof value === 'function')
      el.addEventListener(key.replace(/^on/, '').toLowerCase(), value)
    else if (key === 'class') el.className = String(value)
    else if (key in el && typeof value !== 'string')
      (el as unknown as Record<string, unknown>)[key] = value
    else el.setAttribute(key, value === true ? '' : String(value))
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue
    el.append(typeof child === 'string' ? document.createTextNode(child) : child)
  }
  return el
}
