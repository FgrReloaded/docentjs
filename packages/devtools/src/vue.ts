/**
 * `<DocentDevtools :docent="…" />` for Vue. Renders nothing; in development it
 * lazy-loads and mounts the panel. In production builds the loader is removed.
 */

import { defineComponent, onBeforeUnmount, onMounted, type PropType } from 'vue'
import type { MountOptions } from './panel'
import { type DevtoolsTarget, resolveDocent } from './resolve'

export const DocentDevtools = defineComponent({
  name: 'DocentDevtools',
  props: {
    /** The manager from `createDocent()`, or the handle returned by `useDocent()`. */
    docent: { type: Object as PropType<DevtoolsTarget>, default: undefined },
    open: { type: Boolean, default: undefined },
    shortcut: { type: [Object, Boolean] as PropType<MountOptions['shortcut']>, default: undefined },
  },
  setup(props) {
    let cancelled = false
    let unmount: (() => void) | undefined
    onMounted(() => {
      const manager = resolveDocent(props.docent)
      if (process.env.NODE_ENV === 'production' || !manager) return
      const options: MountOptions = {}
      if (props.open !== undefined) options.open = props.open
      if (props.shortcut !== undefined) options.shortcut = props.shortcut
      void import('./panel').then(({ mount }) => {
        if (!cancelled) unmount = mount(manager, options)
      })
    })
    onBeforeUnmount(() => {
      cancelled = true
      unmount?.()
    })
    return () => null
  },
})
