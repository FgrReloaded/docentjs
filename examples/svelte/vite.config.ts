import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// The built app is served from https://docentjs.dev/examples/svelte/ alongside
// the docs; the dev server stays at the root.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/examples/svelte/' : '/',
  plugins: [svelte()],
}))
