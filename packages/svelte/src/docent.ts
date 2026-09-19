import type { Docent, DocentState, RenderContext } from '@docentjs/core'
import { type CreateDocentOptions, createDocent } from '@docentjs/dom'
import { type Component, mount, unmount } from 'svelte'
import { type Readable, readable } from 'svelte/store'

export interface SvelteDocentOptions extends CreateDocentOptions {
  /** Your own popover component, mounted per step with `ctx` as a prop. */
  popover?: Component<{ ctx: RenderContext }>
}

export interface DocentHandle {
  /** Store: which tour is running, and which tours are known. */
  state: Readable<DocentState>
  docent: Docent
  identify: Docent['identify']
  track: Docent['track']
  start: Docent['start']
  stop: Docent['stop']
  reset: Docent['reset']
  refresh: Docent['refresh']
  /** Stop and clean up. Call from `onDestroy`. */
  destroy: () => Promise<void>
}

/**
 * Create the tour manager: it watches triggers, checks conditions and
 * frequency, and runs one tour at a time.
 */
export function useDocent(options: SvelteDocentOptions = {}): DocentHandle {
  const { popover, ...rest } = options
  const merged: CreateDocentOptions = { ...rest }
  if (popover) {
    merged.renderer = {
      ...merged.renderer,
      headless: {
        render: (ctx, container) => {
          const instance = mount(popover, { target: container, props: { ctx } })
          return () => void unmount(instance)
        },
      },
    }
  }
  const docent = createDocent(merged)
  const state = readable(docent.getState(), (set) => {
    set(docent.getState())
    return docent.subscribe(set)
  })
  return {
    state,
    docent,
    identify: (id, traits) => docent.identify(id, traits),
    track: (name) => docent.track(name),
    start: (id, opts) => docent.start(id, opts),
    stop: () => docent.stop(),
    reset: (id) => docent.reset(id),
    refresh: () => docent.refresh(),
    destroy: () => docent.destroy(),
  }
}
