import { type CollectionEntry, getCollection } from 'astro:content'
import type { APIRoute, GetStaticPaths } from 'astro'
import { renderCard } from '../../og/card'
import { sectionOf } from '../../og/pages'

export const getStaticPaths = (async () => {
  const entries = await getCollection('docs')
  return entries.map((entry) => ({ params: { slug: entry.id }, props: { entry } }))
}) satisfies GetStaticPaths

export const GET: APIRoute<{ entry: CollectionEntry<'docs'> }> = async ({ props }) => {
  const { id, data } = props.entry
  const png = await renderCard({
    title: data.hero?.title ?? data.title,
    description: data.hero?.tagline ?? data.description,
    eyebrow: sectionOf(id),
  })
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } })
}
