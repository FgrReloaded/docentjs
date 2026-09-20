import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// The built app is served from https://docentjs.dev/examples/vue/ alongside
// the docs; the dev server stays at the root.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/examples/vue/' : '/',
  plugins: [vue()],
}))
