import { defineConfig } from 'tsdown'
import { minifyStylesPlugin } from './css-minify.ts'

export default defineConfig({
  entry: ['src/index.ts', 'src/themes.ts', 'src/validate.ts'],
  format: ['esm', 'cjs'],
  platform: 'neutral',
  dts: true,
  sourcemap: true,
  clean: true,
  plugins: [minifyStylesPlugin()],
})
