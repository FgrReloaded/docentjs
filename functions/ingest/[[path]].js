const API_HOST = 'us.i.posthog.com'
const ASSET_HOST = 'us-assets.i.posthog.com'

export async function onRequest({ request }) {
  const url = new URL(request.url)
  const path = url.pathname.replace(/^\/ingest/, '') || '/'
  const host = path.startsWith('/static/') ? ASSET_HOST : API_HOST

  const headers = new Headers(request.headers)

  headers.delete('cookie')

  const ip = request.headers.get('cf-connecting-ip')
  if (ip) headers.set('x-forwarded-for', ip)

  return fetch(`https://${host}${path}${url.search}`, {
    method: request.method,
    headers,
    body:
      request.method === 'GET' || request.method === 'HEAD'
        ? undefined
        : await request.arrayBuffer(),
    redirect: 'manual',
  })
}
