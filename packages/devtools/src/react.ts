/**
 * `<DocentDevtools docent={…} />` for React. Renders nothing; in development it
 * lazy-loads and mounts the panel. In production builds the loader is removed.
 */

import { useEffect } from 'react'
import type { MountOptions } from './app/mount'
import { type DevtoolsTarget, resolveDocent } from './resolve'

export interface DocentDevtoolsProps extends MountOptions {
  /** The manager from `createDocent()`, or the handle returned by `useDocent()`. */
  docent: DevtoolsTarget
}

export function DocentDevtools({ docent, ...options }: DocentDevtoolsProps): null {
  const manager = resolveDocent(docent)
  // Options are read when the panel mounts, like `mount()`.
  // biome-ignore lint/correctness/useExhaustiveDependencies: remount only when the manager changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' || !manager) return
    let cancelled = false
    let unmount: (() => void) | undefined
    void import('./app/mount').then(({ mount }) => {
      if (!cancelled) unmount = mount(manager, options)
    })
    return () => {
      cancelled = true
      unmount?.()
    }
  }, [manager])
  return null
}
