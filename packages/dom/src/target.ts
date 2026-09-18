/**
 * Resolves schema targets to DOM elements. Pierces open shadow roots as a
 * fallback and can wait for elements that render later.
 */

import type { Target, TargetSpec } from '@docentjs/core'

export type QueryRoot = Document | DocumentFragment | Element

/** Attribute that `{ name }` targets resolve through. */
export const NAME_ATTRIBUTE = 'data-docent'

function escapeAttr(value: string): string {
  const css = (globalThis as { CSS?: { escape?: (s: string) => string } }).CSS
  return css?.escape ? css.escape(value) : value.replace(/["\\]/g, '\\$&')
}

export function toSpec(target: Target): TargetSpec {
  return typeof target === 'string' ? { selectors: [target] } : target
}

/** Selectors to try, in order, for a target. */
export function candidateSelectors(target: Target): string[] {
  const spec = toSpec(target)
  const out: string[] = []
  if (spec.name) out.push(`[${NAME_ATTRIBUTE}="${escapeAttr(spec.name)}"]`)
  if (spec.selectors) out.push(...spec.selectors)
  return out
}

function safeQueryAll(root: QueryRoot, selector: string): Element[] {
  try {
    return Array.from(root.querySelectorAll(selector))
  } catch {
    return []
  }
}

/** Query the root, then every open shadow root beneath it. */
export function queryAllDeep(root: QueryRoot, selector: string): Element[] {
  const direct = safeQueryAll(root, selector)
  if (direct.length > 0) return direct
  const out: Element[] = []
  for (const el of safeQueryAll(root, '*')) {
    if (el.shadowRoot) out.push(...queryAllDeep(el.shadowRoot, selector))
  }
  return out
}

export function resolveTarget(target: Target, root: QueryRoot = document): Element | null {
  const spec = toSpec(target)
  let scope: QueryRoot = root
  if (spec.within) {
    const container = queryAllDeep(root, spec.within)[0]
    if (!container) return null
    scope = container
  }
  for (const selector of candidateSelectors(spec)) {
    const matches = queryAllDeep(scope, selector)
    if (matches.length > 0) return matches[spec.nth ?? 0] ?? null
  }
  return null
}

/**
 * Resolve now, or watch the DOM until the target appears, the timeout passes,
 * or the signal aborts. Resolves `null` when it never shows up.
 */
export function waitForTarget(
  target: Target,
  timeoutMs: number,
  signal?: AbortSignal,
  root: QueryRoot = document,
): Promise<Element | null> {
  const now = resolveTarget(target, root)
  if (now || signal?.aborted) return Promise.resolve(now)

  return new Promise((resolve) => {
    let scheduled = false
    const observed =
      root.nodeType === Node.DOCUMENT_NODE ? (root as Document).documentElement : root
    const done = (el: Element | null) => {
      observer.disconnect()
      if (timer !== undefined) clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
      resolve(el)
    }
    const check = () => {
      scheduled = false
      const el = resolveTarget(target, root)
      if (el) done(el)
    }
    const observer = new MutationObserver(() => {
      if (scheduled) return
      scheduled = true
      queueMicrotask(check)
    })
    const onAbort = () => done(null)
    const timer = Number.isFinite(timeoutMs) ? setTimeout(() => done(null), timeoutMs) : undefined
    signal?.addEventListener('abort', onAbort, { once: true })
    observer.observe(observed, { childList: true, subtree: true, attributes: true })
  })
}
