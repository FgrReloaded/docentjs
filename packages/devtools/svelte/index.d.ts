import type { Docent } from '@docentjs/core'
import type { Component } from 'svelte'
import type { MountOptions } from '../dist/index.js'

export interface DocentDevtoolsProps {
  /** The manager from `createDocent()`, or the handle returned by `useDocent()`. */
  docent: Docent | { docent: Docent } | null | undefined
  open?: boolean
  shortcut?: MountOptions['shortcut']
}

/** Renders nothing; mounts the devtools panel in development only. */
export declare const DocentDevtools: Component<DocentDevtoolsProps>
