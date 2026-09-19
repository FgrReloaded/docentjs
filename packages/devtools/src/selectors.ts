/**
 * Suggests targets for an element the developer picked on the page, most
 * robust first. Robust means it survives refactors and styling changes.
 */

export type Robustness = 'high' | 'medium' | 'low'

export interface TargetCandidate {
  /** How to write it in a tour: a logical name or a CSS selector. */
  kind: 'name' | 'selector'
  value: string
  robustness: Robustness
  /** Why this candidate is (or is not) a good anchor. */
  note: string
  /** Matches exactly one element on the current page. */
  unique: boolean
}

const TEST_ATTRS = ['data-testid', 'data-test', 'data-test-id', 'data-cy', 'data-qa']

function esc(value: string): string {
  const css = (globalThis as { CSS?: { escape?: (s: string) => string } }).CSS
  return css?.escape ? css.escape(value) : value.replace(/[^\w-]/g, (c) => `\\${c}`)
}

function attr(value: string): string {
  return value.replace(/["\\]/g, '\\$&')
}

function count(root: ParentNode, selector: string): number {
  try {
    return root.querySelectorAll(selector).length
  } catch {
    return 0
  }
}

/** Ids that frameworks generate (React `:r1:`, `ember123`, long hashes) change between renders. */
export function looksGenerated(id: string): boolean {
  return /^:|:$|\d{3,}|^[a-f0-9]{8,}$|^(ember|react|radix|headlessui|mui)-?\w*\d/i.test(id)
}

/** Hashed CSS-module / CSS-in-JS class names are unstable. */
export function looksHashed(cls: string): boolean {
  return /^(css|sc|jsx|emotion|styled)-|_[a-z0-9]{5,}$|^[a-z]{1,3}[A-Z0-9][a-zA-Z0-9]{4,}$|__[a-zA-Z0-9]{5,}/.test(
    cls,
  )
}

/** A structural path such as `main > div:nth-of-type(2) > button`. Always works, breaks easily. */
export function structuralPath(el: Element, doc: Document = el.ownerDocument): string {
  const parts: string[] = []
  let cur: Element | null = el
  while (cur && cur !== doc.body && cur !== doc.documentElement) {
    const tag = cur.tagName.toLowerCase()
    if (cur.id && !looksGenerated(cur.id) && count(doc, `#${esc(cur.id)}`) === 1) {
      parts.unshift(`#${esc(cur.id)}`)
      break
    }
    const parent: Element | null = cur.parentElement
    const siblings = parent
      ? Array.from(parent.children).filter((c) => c.tagName === cur?.tagName)
      : []
    parts.unshift(siblings.length > 1 ? `${tag}:nth-of-type(${siblings.indexOf(cur) + 1})` : tag)
    cur = parent
  }
  return parts.join(' > ')
}

/** A short kebab-case name from the element's text, for suggesting `data-docent`. */
export function suggestName(el: Element): string {
  const text = (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().toLowerCase()
  const slug = text
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .join('-')
  return slug || el.tagName.toLowerCase()
}

export function targetCandidates(el: Element, doc: Document = el.ownerDocument): TargetCandidate[] {
  const out: TargetCandidate[] = []
  const add = (
    kind: TargetCandidate['kind'],
    value: string,
    robustness: Robustness,
    note: string,
  ) => {
    const selector = kind === 'name' ? `[data-docent="${attr(value)}"]` : value
    if (out.some((c) => c.kind === kind && c.value === value)) return
    out.push({ kind, value, robustness, note, unique: count(doc, selector) === 1 })
  }
  const tag = el.tagName.toLowerCase()

  const name = el.getAttribute('data-docent')
  if (name)
    add('name', name, 'high', 'Logical name: survives refactors and works on native platforms.')

  for (const a of TEST_ATTRS) {
    const v = el.getAttribute(a)
    if (v)
      add(
        'selector',
        `[${a}="${attr(v)}"]`,
        'high',
        'Test id: stable, already maintained for tests.',
      )
  }

  if (el.id) {
    if (looksGenerated(el.id))
      add('selector', `#${esc(el.id)}`, 'low', 'Id looks generated; it may change between renders.')
    else add('selector', `#${esc(el.id)}`, 'medium', 'Id: fine if nobody renames it.')
  }

  const label = el.getAttribute('aria-label')
  if (label)
    add(
      'selector',
      `${tag}[aria-label="${attr(label)}"]`,
      'medium',
      'Accessible label: changes when copy changes.',
    )

  const nameAttr = el.getAttribute('name')
  if (nameAttr && /^(input|select|textarea|button)$/.test(tag)) {
    add('selector', `${tag}[name="${attr(nameAttr)}"]`, 'medium', 'Form field name.')
  }

  const classes = Array.from(el.classList)
    .filter((c) => !looksHashed(c))
    .slice(0, 3)
  if (classes.length > 0) {
    const sel = `${tag}.${classes.map(esc).join('.')}`
    add('selector', sel, 'low', 'Class names: break when styling changes.')
  }

  add(
    'selector',
    structuralPath(el, doc),
    'low',
    'Structural path: breaks when the layout changes.',
  )
  const rank: Record<Robustness, number> = { high: 0, medium: 1, low: 2 }
  return out.sort(
    (a, b) => Number(b.unique) - Number(a.unique) || rank[a.robustness] - rank[b.robustness],
  )
}
