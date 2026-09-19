// Bundlers replace `process.env.NODE_ENV` with a string literal at build time,
// which lets production builds drop the panel. Declared here to avoid Node types.
declare const process: { env: { NODE_ENV?: string } }
