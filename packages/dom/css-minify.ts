/**
 * Build-time minification for the stylesheet template literal in src/styles.ts.
 * Conservative on purpose: strips comments, collapses whitespace, and removes
 * spaces only around `{ } ; , >` and after `:`. It never touches `+`/`-`
 * (which calc() needs) or descendant-selector spaces.
 */
export function minifyCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};,>])\s*/g, '$1')
    .replace(/:\s+/g, ':')
    .replace(/;}/g, '}')
    .trim()
}

/** Rolldown plugin: minify every template literal in styles.ts (they contain only CSS). */
export function minifyStylesPlugin() {
  return {
    name: 'docent-minify-styles',
    transform(code: string, id: string) {
      if (!/[\\/]src[\\/]styles\.ts$/.test(id)) return null
      return {
        code: code.replace(/`([^`]*)`/g, (_m, css: string) => `\`${minifyCss(css)}\``),
        map: null,
      }
    },
  }
}
