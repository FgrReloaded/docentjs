/**
 * Minimal static server for e2e. Serves the repo root and maps `/app` and
 * `/app/*` to the fixture page so route-based tours can use real pathnames.
 */
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'

const root = process.cwd()
// biome-ignore lint/suspicious/noUndeclaredEnvVars: set by playwright.config.ts
const port = Number(process.env.PORT ?? 4180)
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
}

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')
  let pathname = decodeURIComponent(url.pathname)
  if (pathname === '/app' || pathname.startsWith('/app/')) pathname = '/e2e/fixtures/app.html'
  const file = normalize(join(root, pathname))
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) {
    res.writeHead(404).end('not found')
    return
  }
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' })
  createReadStream(file).pipe(res)
}).listen(port, '127.0.0.1', () => console.log(`e2e server on http://127.0.0.1:${port}`))
