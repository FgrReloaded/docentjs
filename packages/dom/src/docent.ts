import { Docent, type DocentOptions } from '@docentjs/core'
import { DomTourController } from './create'
import { createDomEnvironment } from './environment'
import type { DomRendererOptions } from './renderer'
import { createLocalStorage } from './storage'

export interface CreateDocentOptions
  extends Omit<DocentOptions, 'environment' | 'createController'> {
  /** Renderer options shared by every tour: theme, templates, slots, headless, labels. */
  renderer?: DomRendererOptions
  /** Document to watch and render into. Defaults to the global document. */
  document?: Document
}

/**
 * Create the tour manager for the browser. It loads your tours, watches their
 * triggers (routes, elements, events, delays), checks conditions and frequency
 * per user, and runs at most one tour at a time.
 *
 * ```ts
 * const docent = createDocent({ tours: [welcome, invoices] })
 * docent.identify(user.id, { plan: user.plan })
 * docent.track('invoice-saved')
 * ```
 */
export function createDocent(options: CreateDocentOptions = {}): Docent {
  const { renderer, document: doc, ...rest } = options
  const rendererOptions: DomRendererOptions = doc ? { ...renderer, document: doc } : { ...renderer }
  return new Docent({
    ...rest,
    storage: rest.storage ?? createLocalStorage(),
    environment: createDomEnvironment(doc),
    createController: (tour, shared) =>
      new DomTourController(tour, { ...shared, renderer: rendererOptions }),
  })
}
