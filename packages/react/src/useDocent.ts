import type { Docent, DocentState, RenderContext } from '@docentjs/core'
import { type CreateDocentOptions, createDocent } from '@docentjs/dom'
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { createPortal } from 'react-dom'
import { useDocentDefaults } from './context'

export interface UseDocentOptions extends CreateDocentOptions {
  /** Render your own popover for every tour. Render `portal` once in your tree. */
  popover?: (ctx: RenderContext) => ReactNode
}

export interface DocentHandle {
  /** Which tour is running, and which tours are known. */
  state: DocentState
  docent: Docent
  identify: Docent['identify']
  track: Docent['track']
  start: Docent['start']
  stop: Docent['stop']
  reset: Docent['reset']
  refresh: Docent['refresh']
  /** Portal for the custom `popover`. */
  portal: ReactNode
}

/**
 * Create the tour manager for this component's lifetime. It watches triggers,
 * checks conditions and frequency, and runs one tour at a time. Provider
 * defaults (renderer, identity, storage, sink) are merged in.
 *
 * Options are read once on mount. For tours that change at runtime pass a
 * `TourSource`; for user changes call `identify()`.
 */
export function useDocent(options: UseDocentOptions = {}): DocentHandle {
  const defaults = useDocentDefaults()
  const [portalTarget, setPortalTarget] = useState<{
    ctx: RenderContext
    container: HTMLElement
  } | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  const docent = useMemo(() => {
    const { popover, ...own } = optionsRef.current
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
    if (popover && merged.renderer) {
      merged.renderer.headless = {
        render: (ctx, container) => {
          setPortalTarget({ ctx, container })
          return () => setPortalTarget((cur) => (cur?.container === container ? null : cur))
        },
      }
    }
    return createDocent(merged)
  }, [defaults])

  useEffect(() => () => void docent.destroy(), [docent])

  const state = useSyncExternalStore(
    useCallback((cb: () => void) => docent.subscribe(cb), [docent]),
    useStableState(docent),
    useStableState(docent),
  )

  const popover = options.popover
  const portal =
    portalTarget && popover ? createPortal(popover(portalTarget.ctx), portalTarget.container) : null

  return useMemo<DocentHandle>(
    () => ({
      state,
      docent,
      identify: (id, traits) => docent.identify(id, traits),
      track: (name) => docent.track(name),
      start: (id, opts) => docent.start(id, opts),
      stop: () => docent.stop(),
      reset: (id) => docent.reset(id),
      refresh: () => docent.refresh(),
      portal,
    }),
    [docent, state, portal],
  )
}

/** `getState()` returns a new object each call; keep a stable snapshot until it changes. */
function useStableState(docent: Docent): () => DocentState {
  const ref = useRef<DocentState>(docent.getState())
  return useCallback(() => {
    const next = docent.getState()
    const cur = ref.current
    if (cur.active !== next.active || cur.tours.join('\n') !== next.tours.join('\n'))
      ref.current = next
    return ref.current
  }, [docent])
}
