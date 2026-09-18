import { type ControllerOptions, type Tour, TourController } from '@docentjs/core'
import { DomRenderer, type DomRendererOptions } from './renderer'
import { createLocalStorage } from './storage'

export interface CreateTourOptions extends Omit<ControllerOptions, 'tour' | 'renderer'> {
  renderer?: DomRendererOptions
  /** Follow browser navigation to pause and resume route-bound steps. Default true. */
  followRoutes?: boolean
}

/**
 * A controller pre-wired for the browser: DOM renderer, localStorage
 * persistence and route change tracking.
 */
export class DomTourController extends TourController {
  private readonly cleanups: Array<() => void> = []

  constructor(tour: Tour, options: CreateTourOptions = {}) {
    const { renderer: rendererOptions, followRoutes, ...rest } = options
    const renderer = new DomRenderer(rendererOptions)
    super({ ...rest, tour, renderer, storage: rest.storage ?? createLocalStorage() })

    if (followRoutes !== false && typeof window !== 'undefined') {
      const onChange = () => void this.routeChanged()
      for (const type of ['popstate', 'hashchange']) {
        window.addEventListener(type, onChange)
        this.cleanups.push(() => window.removeEventListener(type, onChange))
      }
      const nav = (window as { navigation?: EventTarget }).navigation
      if (nav) {
        nav.addEventListener('navigatesuccess', onChange)
        this.cleanups.push(() => nav.removeEventListener('navigatesuccess', onChange))
      }
    }
  }

  override async destroy(): Promise<void> {
    for (const c of this.cleanups) c()
    this.cleanups.length = 0
    await super.destroy()
  }
}

/** Create a browser-ready tour. Call `.start()` or `.resume()` on the result. */
export function createTour(tour: Tour, options?: CreateTourOptions): DomTourController {
  return new DomTourController(tour, options)
}
