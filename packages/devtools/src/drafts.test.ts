import type { Tour } from '@docentjs/core'
import { describe, expect, it } from 'vitest'
import { DRAFTS_KEY, loadDrafts, reconcile, saveDrafts, stableJson } from './drafts'

const tour = (title: string): Tour => ({
  schemaVersion: 1,
  id: 't',
  steps: [{ id: 'a', title }],
})

function memory(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => void map.delete(k),
    setItem: (k, v) => void map.set(k, v),
  }
}

describe('drafts', () => {
  it('compares tours regardless of key order', () => {
    expect(stableJson({ b: 1, a: { d: 2, c: [3, { f: 1, e: 0 }] } })).toBe(
      stableJson({ a: { c: [3, { e: 0, f: 1 }], d: 2 }, b: 1 }),
    )
  })

  it('restores, warns when the code moved on, and drops drafts already in the code', () => {
    const code = tour('Hello')
    const draft = { tour: tour('Edited'), base: stableJson(code), at: 1 }
    expect(reconcile(draft, code)).toBe('restore')
    expect(reconcile(draft, tour('Changed in code'))).toBe('stale')
    expect(reconcile(draft, tour('Edited'))).toBe('saved')
  })

  it('round-trips through storage and ignores junk', () => {
    const storage = memory()
    const drafts = { t: { tour: tour('Edited'), base: 'x', at: 5 } }
    saveDrafts(drafts, storage)
    expect(loadDrafts(storage)).toEqual(drafts)
    saveDrafts({}, storage)
    expect(storage.getItem(DRAFTS_KEY)).toBeNull()
    storage.setItem(DRAFTS_KEY, '{"t":{"tour":1},"u":null')
    expect(loadDrafts(storage)).toEqual({})
    storage.setItem(DRAFTS_KEY, '{"t":{"tour":1},"u":{"tour":{},"base":"b"}}')
    expect(Object.keys(loadDrafts(storage))).toEqual(['u'])
  })
})
