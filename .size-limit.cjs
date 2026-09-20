/**
 * Bundle budgets.
 *
 * Code the library loads on demand is treated as external for the
 * initial-load entries and measured on its own: connector arrows and theme
 * presets, which load only for tours that use one, and the schema checker,
 * which production builds drop along with the call that imports it.
 * (size-limit inlines dynamic imports, so they have to be listed here.)
 */
const LAZY = /connector-[\w-]+\.js$|themes(-[\w-]+)?\.js$|@docentjs\/core\/validate$/
const initialLoad = (config) => {
  const previous = config.external
  config.external = (id, ...rest) =>
    LAZY.test(id) ||
    (typeof previous === 'function'
      ? previous(id, ...rest)
      : Array.isArray(previous)
        ? previous.includes(id)
        : false)
  return config
}

module.exports = [
  {
    name: 'createTour (core + dom, single tour)',
    path: 'packages/dom/dist/index.js',
    import: '{ createTour }',
    modifyRolldownConfig: initialLoad,
    limit: '14.25 kB',
  },
  {
    name: 'createDocent (core + dom + manager)',
    path: 'packages/dom/dist/index.js',
    import: '{ createDocent }',
    modifyRolldownConfig: initialLoad,
    limit: '16 kB',
  },
  {
    name: 'schema checker (development only)',
    path: 'packages/core/dist/validate.js',
    limit: '4.75 kB',
  },
  {
    name: 'theme presets (loaded when a tour names one)',
    path: 'packages/dom/dist/themes.js',
    limit: '1 kB',
  },
  {
    name: 'connector arrows (loaded on first use)',
    path: 'packages/dom/dist/connector-*.js',
    limit: '2.5 kB',
  },
  {
    name: '@docentjs/core (everything)',
    path: 'packages/core/dist/index.js',
    limit: '5.5 kB',
  },
]
