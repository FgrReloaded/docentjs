import type { CreateTourOptions, DomRendererOptions } from '@docentjs/dom'
import { createContext, useContext } from 'react'

/** Defaults every `useTour` in the subtree inherits: theme, templates, identity, sink, storage. */
export type DocentDefaults = Omit<CreateTourOptions, 'hooks'>

export const DocentContext = createContext<DocentDefaults>({})

export function useDocentDefaults(): DocentDefaults {
  return useContext(DocentContext)
}

/** Shallow-merge provider defaults with per-tour options; renderer options merge one level deeper. */
export function mergeOptions(base: DocentDefaults, own: CreateTourOptions): CreateTourOptions {
  const renderer: DomRendererOptions | undefined =
    base.renderer || own.renderer
      ? {
          ...base.renderer,
          ...own.renderer,
          templates: { ...base.renderer?.templates, ...own.renderer?.templates },
          slots: { ...base.renderer?.slots, ...own.renderer?.slots },
          theme: { ...base.renderer?.theme, ...own.renderer?.theme },
        }
      : undefined
  const merged: CreateTourOptions = { ...base, ...own }
  if (renderer) merged.renderer = renderer
  return merged
}
