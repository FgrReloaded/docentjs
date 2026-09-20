import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The built app is served from https://docentjs.dev/examples/react/ alongside
// the docs; the dev server stays at the root.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/examples/react/' : '/',
  plugins: [react()],
}))
