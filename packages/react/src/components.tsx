import type { Tour as TourDefinition } from '@docentjs/core'
import { type ReactNode, useEffect } from 'react'
import { DocentContext, type DocentDefaults } from './context'
import { type TourHandle, type UseTourOptions, useTour } from './useTour'

export interface DocentProviderProps extends DocentDefaults {
  children?: ReactNode
}

/** Share renderer defaults (theme, templates, labels), identity, storage and sink with every tour below. */
export function DocentProvider({ children, ...defaults }: DocentProviderProps) {
  return <DocentContext.Provider value={defaults}>{children}</DocentContext.Provider>
}

export interface TourProps extends UseTourOptions {
  tour: TourDefinition
  /** Start as soon as the component mounts. `'resume'` continues from persisted progress. */
  autoStart?: boolean | 'resume'
  /** Render prop receiving the tour controls. */
  children?: (tour: TourHandle) => ReactNode
}

/**
 * Component form of `useTour`. Renders the custom-popover portal for you and
 * hands the controls to a render prop.
 */
export function Tour({ tour, autoStart, children, ...options }: TourProps) {
  const handle = useTour(tour, options)
  const { controller } = handle

  // biome-ignore lint/correctness/useExhaustiveDependencies: start once per controller instance
  useEffect(() => {
    if (autoStart === 'resume') void controller.resume()
    else if (autoStart) void controller.start()
  }, [controller])

  return (
    <>
      {handle.portal}
      {children?.(handle)}
    </>
  )
}
