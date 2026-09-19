import type { Docent, DocentState, RenderContext } from '@docentjs/core'
import { type CreateDocentOptions, createDocent } from '@docentjs/dom'
import { getCurrentInstance, inject, onUnmounted, type Ref, shallowRef } from 'vue'
import { DOCENT_KEY, type DocentDefaults } from './useTour'

export interface UseDocentOptions extends CreateDocentOptions {
  /** Render your own popover with `<TourPopover :tour="docent">`. */
  popover?: boolean
}

export interface DocentHandle {
  /** Reactive: which tour is running, and which tours are known. */
  state: Readonly<Ref<DocentState>>
  docent: Docent
  identify: Docent['identify']
  track: Docent['track']
  start: Docent['start']
  stop: Docent['stop']
  reset: Docent['reset']
  refresh: Docent['refresh']
  popoverContext: Readonly<Ref<RenderContext | null>>
  popoverTarget: Readonly<Ref<HTMLElement | null>>
  destroy: () => Promise<void>
}

/**
 * Create the tour manager. It watches triggers, checks conditions and
 * frequency, and runs one tour at a time. Destroyed with the component when
 * called in `setup()`; outside a component call `destroy()` yourself.
 */
export function useDocent(options: UseDocentOptions = {}): DocentHandle {
  const inComponent = getCurrentInstance() !== null
  const defaults: DocentDefaults = inComponent ? (inject(DOCENT_KEY, {}) as DocentDefaults) : {}
  const { popover, ...own } = options
  const merged: CreateDocentOptions = {
    ...(defaults.identity ? { identity: defaults.identity } : {}),
    ...(defaults.storage ? { storage: defaults.storage } : {}),
    ...(defaults.sink ? { sink: defaults.sink } : {}),
    ...(defaults.custom ? { custom: defaults.custom } : {}),
    ...own,
    renderer: {
      ...defaults.renderer,
      ...own.renderer,
      templates: { ...defaults.renderer?.templates, ...own.renderer?.templates },
      slots: { ...defaults.renderer?.slots, ...own.renderer?.slots },
      theme: { ...defaults.renderer?.theme, ...own.renderer?.theme },
    },
  }

  const popoverContext = shallowRef<RenderContext | null>(null)
  const popoverTarget = shallowRef<HTMLElement | null>(null)
  if (popover && merged.renderer) {
    merged.renderer.headless = {
      render: (ctx, container) => {
        popoverContext.value = ctx
        popoverTarget.value = container
        return () => {
          if (popoverTarget.value === container) {
            popoverContext.value = null
            popoverTarget.value = null
          }
        }
      },
    }
  }

  const docent = createDocent(merged)
  const state = shallowRef<DocentState>(docent.getState())
  const off = docent.subscribe((s) => {
    state.value = s
  })
  const destroy = async () => {
    off()
    await docent.destroy()
  }
  if (inComponent) onUnmounted(() => void destroy())

  return {
    state,
    docent,
    identify: (id, traits) => docent.identify(id, traits),
    track: (name) => docent.track(name),
    start: (id, opts) => docent.start(id, opts),
    stop: () => docent.stop(),
    reset: (id) => docent.reset(id),
    refresh: () => docent.refresh(),
    popoverContext,
    popoverTarget,
    destroy,
  }
}
