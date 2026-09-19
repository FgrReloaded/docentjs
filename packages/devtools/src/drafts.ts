/**
 * Unsaved devtools edits, kept in this browser's localStorage so a reload or
 * a hot-module update does not lose them. Each draft remembers the code
 * version it started from, so the panel can tell when the code has since
 * changed (stale) or already contains the edits (saved, and dropped).
 */

import type { Tour } from '@docentjs/core'

export const DRAFTS_KEY = 'docent-devtools-drafts'

export interface SavedDraft {
  tour: Tour
  /** Stable JSON of the code's tour when editing started. */
  base: string
  /** When the draft was last changed (ms since epoch). */
  at: number
}

export type SavedDrafts = Record<string, SavedDraft>

/** JSON with sorted object keys, so equal tours compare equal whatever their key order. */
export function stableJson(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : 1)),
        )
      : v,
  )
}

export function loadDrafts(storage: Storage | undefined = safeStorage()): SavedDrafts {
  try {
    const parsed = JSON.parse(storage?.getItem(DRAFTS_KEY) ?? '{}') as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    const out: SavedDrafts = {}
    for (const [id, d] of Object.entries(parsed as Record<string, Partial<SavedDraft>>)) {
      if (d?.tour && typeof d.tour === 'object' && typeof d.base === 'string') {
        out[id] = { tour: d.tour, base: d.base, at: typeof d.at === 'number' ? d.at : 0 }
      }
    }
    return out
  } catch {
    return {}
  }
}

export function saveDrafts(
  drafts: SavedDrafts,
  storage: Storage | undefined = safeStorage(),
): void {
  try {
    if (Object.keys(drafts).length === 0) storage?.removeItem(DRAFTS_KEY)
    else storage?.setItem(DRAFTS_KEY, JSON.stringify(drafts))
  } catch {
    // Storage full or blocked: edits still work for this session.
  }
}

/**
 * What to do with a saved draft now that the code's version of the tour is known.
 * - `saved`: the code already matches the draft (it was pasted in); drop it.
 * - `stale`: the code changed since the draft started; restore, but warn.
 * - `restore`: the code is unchanged; restore the draft.
 */
export function reconcile(draft: SavedDraft, code: Tour): 'saved' | 'stale' | 'restore' {
  const codeJson = stableJson(code)
  if (stableJson(draft.tour) === codeJson) return 'saved'
  return draft.base === codeJson ? 'restore' : 'stale'
}

function safeStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage
  } catch {
    return undefined
  }
}
