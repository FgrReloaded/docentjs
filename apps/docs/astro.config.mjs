import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://docentjs.dev',
  integrations: [
    starlight({
      title: 'Docent',
      description: 'Guided product tours for the web. Spotlight an element, explain it, move on.',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/FgrReloaded/docentjs' },
      ],
      customCss: ['./src/styles/docs.css'],
      sidebar: [
        { label: 'Start here', items: [{ slug: 'getting-started' }, { slug: 'concepts' }] },
        {
          label: 'Guides',
          items: [
            { slug: 'guides/targets' },
            { slug: 'guides/steps' },
            { slug: 'guides/triggers-and-conditions' },
            { slug: 'guides/routes-and-persistence' },
            { slug: 'guides/events-and-hooks' },
          ],
        },
        {
          label: 'Customize',
          items: [
            { slug: 'customize/theming' },
            { slug: 'customize/slots-and-templates' },
            { slug: 'customize/headless' },
          ],
        },
        {
          label: 'Frameworks',
          items: [
            { slug: 'frameworks/react' },
            { slug: 'frameworks/vue' },
            { slug: 'frameworks/svelte' },
          ],
        },
        { label: 'Reference', items: [{ slug: 'reference/schema' }, { slug: 'reference/api' }] },
      ],
    }),
  ],
})
