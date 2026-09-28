/**
 * Adds what Starlight leaves out of each page's <head>: the social card, and
 * structured data describing the project on the home page.
 */
import { defineRouteMiddleware } from '@astrojs/starlight/route-data'
import { OG_HEIGHT, OG_WIDTH, ogImagePath } from './og/pages'

const REPO = 'https://github.com/FgrReloaded/docentjs'

export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute
  const { entry, head } = route
  const site = context.site ?? new URL('https://docentjs.dev')
  const image = new URL(ogImagePath(entry.id), site).href
  const alt = `${entry.data.title} · Docent`

  head.push(
    { tag: 'meta', attrs: { property: 'og:image', content: image } },
    { tag: 'meta', attrs: { property: 'og:image:width', content: String(OG_WIDTH) } },
    { tag: 'meta', attrs: { property: 'og:image:height', content: String(OG_HEIGHT) } },
    { tag: 'meta', attrs: { property: 'og:image:type', content: 'image/png' } },
    { tag: 'meta', attrs: { property: 'og:image:alt', content: alt } },
    { tag: 'meta', attrs: { name: 'twitter:image', content: image } },
    { tag: 'meta', attrs: { name: 'twitter:image:alt', content: alt } },
  )

  // Starlight's route entry for the home page has an empty id.
  if (entry.id !== '' && entry.id !== 'index') return

  // Starlight marks every page an article; the home page is the site.
  const type = head.find((tag) => tag.attrs?.property === 'og:type')
  if (type?.attrs) type.attrs.content = 'website'

  const url = new URL('/', site).href
  head.push({
    tag: 'script',
    attrs: { type: 'application/ld+json' },
    content: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebSite', name: 'Docent', url, description: entry.data.description },
        {
          '@type': 'SoftwareSourceCode',
          name: 'Docent',
          url,
          description: entry.data.description,
          image,
          codeRepository: REPO,
          programmingLanguage: 'TypeScript',
          runtimePlatform: 'Web browser',
          license: 'https://opensource.org/licenses/MIT',
        },
      ],
    }),
  })
})
