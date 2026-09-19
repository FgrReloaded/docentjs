import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/react.ts', 'src/vue.ts'],
  format: ['esm', 'cjs'],
  platform: 'neutral',
  dts: true,
  sourcemap: true,
  clean: true,
  // Bundle Preact so the panel never shares an instance (or its global hooks) with the host app.
  noExternal: ['preact', /^preact\//, '@preact/signals', '@preact/signals-core'],
})
