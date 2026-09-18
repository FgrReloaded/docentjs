import type { EngineState, RenderContext, Tour } from '@docentjs/core'
import { type CreateTourOptions, createTour, type DomTourController } from '@docentjs/dom'
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
import { mergeOptions, useDocentDefaults } from './context'

export interface UseTourOptions extends CreateTourOptions {
  /**
   * Render your own popover for every step. It is portalled into a container
   * the library positions, so app context, hooks and CSS all work. Render
   * `tour.portal` somewhere in your tree to activate it.
   */
  popover?: (ctx: RenderContext) => ReactNode
}

export interface TourHandle {
  state: EngineState
  /** True while the tour is running or paused. */
  active: boolean
  start: (at?: number | string) => Promise<void>
  resume: () => Promise<void>
  next: () => Promise<void>
  back: () => Promise<void>
  skip: () => Promise<void>
  goTo: (step: number | string) => Promise<void>
  /** Report an application event; advances a step waiting on it. */
  notify: (eventName: string) => void
  controller: DomTourController
  /** Portal for the custom `popover`. Render it once anywhere in your tree. */
  portal: ReactNode
}

interface PortalTarget {
  ctx: RenderContext
  container: HTMLElement
}

/**
 * Create and control a tour from a component. The controller lives as long as
 * the component and is recreated when the tour id or version changes, so
 * define tours outside the component or memoise them.
 */
export function useTour(tour: Tour, options: UseTourOptions = {}): TourHandle {
  const defaults = useDocentDefaults()
  const [portalTarget, setPortalTarget] = useState<PortalTarget | null>(null)

  // Latest options without re-creating the controller on every render.
  const optionsRef = useRef(options)
  optionsRef.current = options
  const tourRef = useRef(tour)
  tourRef.current = tour

  // biome-ignore lint/correctness/useExhaustiveDependencies: recreate on tour identity or provider change
  const controller = useMemo(() => {
    const own = optionsRef.current
    const { popover, ...rest } = own
    const merged = mergeOptions(defaults, rest)
    if (popover) {
      merged.renderer = {
        ...merged.renderer,
        headless: {
          render: (ctx, container) => {
            setPortalTarget({ ctx, container })
            return () => setPortalTarget((cur) => (cur?.container === container ? null : cur))
          },
        },
      }
    }
    return createTour(tourRef.current, merged)
  }, [defaults, tour.id, tour.version])

  useEffect(() => () => void controller.destroy(), [controller])

  const state = useSyncExternalStore(
    useCallback((cb: () => void) => controller.subscribe(cb), [controller]),
    () => controller.getState(),
    () => controller.getState(),
  )

  const popover = options.popover
  const portal =
    portalTarget && popover ? createPortal(popover(portalTarget.ctx), portalTarget.container) : null

  return useMemo<TourHandle>(
    () => ({
      state,
      active: state.status === 'running' || state.status === 'paused',
      start: (at) => controller.start(at),
      resume: () => controller.resume(),
      next: () => controller.next(),
      back: () => controller.back(),
      skip: () => controller.skip(),
      goTo: (s) => controller.goTo(s),
      notify: (n) => controller.notify(n),
      controller,
      portal,
    }),
    [controller, state, portal],
  )
}
