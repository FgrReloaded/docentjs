import type { EngineState, RenderContext, Tour } from '@docentjs/core'
import { type CreateTourOptions, createTour, type DomTourController } from '@docentjs/dom'
import {
  getCurrentInstance,
  type InjectionKey,
  inject,
  onUnmounted,
  provide,
  type Ref,
  shallowRef,
} from 'vue'

/** Defaults every `useTour` in the subtree inherits: theme, templates, identity, sink, storage. */
export type DocentDefaults = Omit<CreateTourOptions, 'hooks'>

export const DOCENT_KEY: InjectionKey<DocentDefaults> = Symbol('docent')

/** Call in a parent `setup()` to share defaults with descendant tours. */
export function provideDocentDefaults(defaults: DocentDefaults): void {
  provide(DOCENT_KEY, defaults)
}

export function mergeOptions(base: DocentDefaults, own: CreateTourOptions): CreateTourOptions {
  const merged: CreateTourOptions = { ...base, ...own }
  if (base.renderer || own.renderer) {
    merged.renderer = {
      ...base.renderer,
      ...own.renderer,
      templates: { ...base.renderer?.templates, ...own.renderer?.templates },
      slots: { ...base.renderer?.slots, ...own.renderer?.slots },
      theme: { ...base.renderer?.theme, ...own.renderer?.theme },
    }
  }
  return merged
}

export interface UseTourOptions extends CreateTourOptions {
  /**
   * Render your own popover with `<TourPopover>`. The library positions a
   * container and this composable exposes it through `popoverTarget`.
   */
  popover?: boolean
}

export interface TourHandle {
  /** Reactive engine state. */
  state: Readonly<Ref<EngineState>>
  /** Reactive: true while running or paused. */
  active: Readonly<Ref<boolean>>
  start: (at?: number | string) => Promise<void>
  resume: () => Promise<void>
  next: () => Promise<void>
  back: () => Promise<void>
  skip: () => Promise<void>
  goTo: (step: number | string) => Promise<void>
  notify: (eventName: string) => void
  controller: DomTourController
  /** Current step context while a custom popover is shown. */
  popoverContext: Readonly<Ref<RenderContext | null>>
  /** Container to teleport a custom popover into. */
  popoverTarget: Readonly<Ref<HTMLElement | null>>
  /** Stop and clean up. Called automatically when the owning component unmounts. */
  destroy: () => Promise<void>
}

/**
 * Create and control a tour from `setup()`. The controller lives as long as
 * the component. Outside a component, call `destroy()` yourself.
 */
export function useTour(tour: Tour, options: UseTourOptions = {}): TourHandle {
  const inComponent = getCurrentInstance() !== null
  const defaults = inComponent ? (inject(DOCENT_KEY, {}) as DocentDefaults) : {}
  const { popover, ...rest } = options
  const merged = mergeOptions(defaults, rest)

  const popoverContext = shallowRef<RenderContext | null>(null)
  const popoverTarget = shallowRef<HTMLElement | null>(null)
  if (popover) {
    merged.renderer = {
      ...merged.renderer,
      headless: {
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
      },
    }
  }

  const controller = createTour(tour, merged)
  const state = shallowRef<EngineState>(controller.getState())
  const active = shallowRef(false)
  const unsubscribe = controller.subscribe((s) => {
    state.value = s
    active.value = s.status === 'running' || s.status === 'paused'
  })

  const destroy = async () => {
    unsubscribe()
    await controller.destroy()
  }
  if (inComponent) onUnmounted(() => void destroy())

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
    popoverContext,
    popoverTarget,
    destroy,
  }
}
