import type { EngineState, RenderContext, Tour } from '@docentjs/core'
import { type CreateTourOptions, createTour, type DomTourController } from '@docentjs/dom'
import { type Component, mount, unmount } from 'svelte'
import { type Readable, readable } from 'svelte/store'

export interface SvelteTourOptions extends CreateTourOptions {
  /**
   * Your own popover component. It is mounted into a container the library
   * positions and receives `ctx` (the render context) as a prop.
   */
  popover?: Component<{ ctx: RenderContext }>
}

export interface TourHandle {
  /** Store of the engine state. */
  state: Readable<EngineState>
  /** Store: true while running or paused. */
  active: Readable<boolean>
  start: (at?: number | string) => Promise<void>
  resume: () => Promise<void>
  next: () => Promise<void>
  back: () => Promise<void>
  skip: () => Promise<void>
  goTo: (step: number | string) => Promise<void>
  notify: (eventName: string) => void
  controller: DomTourController
  /** Stop and clean up. Call from `onDestroy`, or use the `tour` action. */
  destroy: () => Promise<void>
}

/**
 * Create a tour with Svelte stores for state. Works in Svelte 4 and 5.
 *
 * ```svelte
 * <script>
 *   const t = useTour(tour, { popover: Card })
 *   onDestroy(t.destroy)
 * </script>
 * <button on:click={() => t.start()}>Start</button>
 * <p>{$t.state.status}</p>
 * ```
 */
export function useTour(tour: Tour, options: SvelteTourOptions = {}): TourHandle {
  const { popover, ...rest } = options
  const merged: CreateTourOptions = { ...rest }
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

  const controller = createTour(tour, merged)
  // Readable stores only listen while subscribed, so sync the current value on each (re)subscribe.
  const state = readable(controller.getState(), (set) => {
    set(controller.getState())
    return controller.subscribe(set)
  })
  const isActive = (s: EngineState) => s.status === 'running' || s.status === 'paused'
  const active = readable(false, (set) => {
    set(isActive(controller.getState()))
    return controller.subscribe((s) => set(isActive(s)))
  })

  return {
    state,
    active,
    start: (at) => controller.start(at),
    resume: () => controller.resume(),
    next: () => controller.next(),
    back: () => controller.back(),
    skip: () => controller.skip(),
    goTo: (s) => controller.goTo(s),
    notify: (n) => controller.notify(n),
    controller,
    destroy: () => controller.destroy(),
  }
}

/**
 * Svelte action that starts a tour when the element mounts and destroys it
 * when the element is removed: `<div use:tour={handle}>`.
 */
export function tour(_node: Element, handle: TourHandle): { destroy(): void } {
  void handle.start()
  return { destroy: () => void handle.destroy() }
}
