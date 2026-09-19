<script>
  /**
   * `<DocentDevtools docent={…} />` for Svelte 5. Renders nothing; in development
   * it lazy-loads and mounts the panel. In production builds the loader is removed.
   * Shipped as source so your Svelte compiler builds it.
   */
  import { onMount } from 'svelte'

  /** @type {{ docent: import('@docentjs/core').Docent | { docent: import('@docentjs/core').Docent } | null | undefined, open?: boolean, shortcut?: import('@docentjs/devtools').MountOptions['shortcut'] }} */
  let { docent, open = undefined, shortcut = undefined } = $props()

  onMount(() => {
    const manager = docent && 'docent' in docent ? docent.docent : docent
    if (process.env.NODE_ENV === 'production' || !manager) return
    let cancelled = false
    /** @type {(() => void) | undefined} */
    let unmount
    /** @type {import('@docentjs/devtools').MountOptions} */
    const options = {}
    if (open !== undefined) options.open = open
    if (shortcut !== undefined) options.shortcut = shortcut
    import('../dist/index.js').then(({ mount }) => {
      if (!cancelled) unmount = mount(manager, options)
    })
    return () => {
      cancelled = true
      unmount?.()
    }
  })
</script>
