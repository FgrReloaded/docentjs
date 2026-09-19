/**
 * Build-time minification for CSS template literals: the stylesheet in
 * src/styles.ts and the connector CSS constant in src/connector.ts.
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

/** Rolldown plugin that minifies the CSS literals at build time. */
export function minifyStylesPlugin() {
  return {
    name: 'docent-minify-styles',
    transform(code: string, id: string) {
      // styles.ts contains only CSS literals.
      if (/[\\/]src[\\/]styles\.ts$/.test(id)) {
        return {
          code: code.replace(/`([^`]*)`/g, (_m, css: string) => `\`${minifyCss(css)}\``),
          map: null,
        }
      }
      // connector.ts has other template literals; only its CSS constant is minified.
      if (/[\\/]src[\\/]connector\.ts$/.test(id)) {
        return {
          code: code.replace(
            /(CONNECTOR_STYLES_CSS = `)([^`]*)(`)/,
            (_m, open: string, css: string, close: string) => open + minifyCss(css) + close,
          ),
          map: null,
        }
      }
      return null
    },
  }
}
