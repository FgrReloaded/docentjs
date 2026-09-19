import { defineConfig } from 'tsdown'
import { minifyStylesPlugin } from './css-minify.ts'

export default defineConfig({
  entry: ['src/index.ts', 'src/themes.ts'],
  format: ['esm', 'cjs'],
  platform: 'browser',
  dts: true,
  sourcemap: true,
  clean: true,
  plugins: [minifyStylesPlugin()],
})
