/**
 * Bundle budgets. Chunks the library loads on demand (connector arrows) are
 * treated as external for the initial-load entries, and measured on their own.
 */
const LAZY = /connector-[\w-]+\.js$/
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
    limit: '13.5 kB',
  },
  {
    name: 'createDocent (core + dom + manager)',
    path: 'packages/dom/dist/index.js',
    import: '{ createDocent }',
    modifyRolldownConfig: initialLoad,
    limit: '15.25 kB',
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
