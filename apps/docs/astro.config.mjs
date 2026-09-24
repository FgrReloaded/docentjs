import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import starlightLlmsTxt from 'starlight-llms-txt'

export default defineConfig({
  site: 'https://docentjs.dev',
  devToolbar: { enabled: false },
  integrations: [
    starlight({
      plugins: [
        starlightLlmsTxt({
          projectName: 'Docent',
          description:
            'Docent is a guided product tour library for the web: it dims the page, spotlights one element, and explains it in a small popover. A tour is a JSON document, so tours can be written by hand, generated, stored in a repo or served from an API. The engine (@docentjs/core) has no DOM code; the web renderer (@docentjs/dom) draws, positions and handles keyboard and focus; thin adapters exist for React, Vue and Svelte. Everything visual is data: arrows, spotlight shape and ring, overlay style, the step counter, the line above the title, theme tokens and presets, so a whole look is one JSON file.',
          details: [
            '## Working with tours',
            '',
            '- A tour is `{ id, steps }` plus optional `trigger`, `conditions` and `options`. Every field is documented at https://docentjs.dev/reference/schema/.',
            '- Point a `.tour.json` file at https://docentjs.dev/schema/tour-v1.json with `$schema` for completion and checking.',
            '- Check tour files from a terminal or CI with `npx @docentjs/cli validate "tours/*.json"`; it exits 1 on errors and `--json` gives machine-readable output.',
            "- Check a tour before shipping it: `import { validateTour } from '@docentjs/dom/validate'`. It reports unknown values, misspelled fields, wrong types and duplicate step ids, each with a path such as `steps[2].arrow` and the value that was probably meant. `createTour` and `createDocent` run the same check automatically in development.",
            '- Prefer `target: { name: "save" }` with `data-docent="save"` in the markup over CSS selectors: names survive redesigns.',
            '- Visual changes belong in the tour JSON (`options.theme`, `options.arrow`, `options.progress`, `options.eyebrow`, `options.spotlight`, `options.overlay`, `options.appearance`), not in CSS, so they travel with the tour.',
            '- A whole look is one JSON file: a theme. Add one with `npx @docentjs/cli theme add <name>` (or a URL), then `renderer: { template: theme }`. Ready-made ones are at https://docentjs.dev/customize/themes/. Reach for `slots` (functions) only when no field covers what is needed, because a look with functions in it can no longer be published or edited as data.',
          ].join('\n'),
          optionalLinks: [
            {
              label: 'Tour JSON Schema',
              url: 'https://docentjs.dev/schema/tour-v1.json',
              description: 'Machine-readable schema for a tour document.',
            },
            {
              label: 'Source',
              url: 'https://github.com/FgrReloaded/docentjs',
              description: 'Repository, issues and changelogs.',
            },
          ],
          promote: ['index', 'getting-started', 'concepts', 'reference/**'],
          demote: ['frameworks/**'],
        }),
      ],
      title: 'Docent',
      description: 'Guided product tours for the web. Spotlight an element, explain it, move on.',
      logo: { light: './src/assets/logo-light.svg', dark: './src/assets/logo-dark.svg' },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/FgrReloaded/docentjs' },
      ],
      customCss: [
        '@fontsource-variable/schibsted-grotesk',
        '@fontsource/spectral/400.css',
        '@fontsource/spectral/500.css',
        '@fontsource/spectral/400-italic.css',
        '@fontsource/fragment-mono/400.css',
        './src/styles/docs.css',
        './src/styles/home.css',
      ],
      components: {
        Head: './src/components/PostHogHead.astro',
        Hero: './src/components/Hero.astro',
        PageTitle: './src/components/PageTitle.astro',
      },
      expressiveCode: {
        themes: ['vitesse-dark', 'vitesse-light'],
        styleOverrides: {
          borderRadius: '10px',
          borderColor: 'var(--sl-color-hairline)',
          codeFontFamily: 'var(--__sl-font-mono)',
          codeFontSize: '0.8125rem',
          codeLineHeight: '1.7',
          codePaddingBlock: '0.9rem',
          codePaddingInline: '1.1rem',
          uiFontFamily: 'var(--__sl-font)',
          frames: {
            shadowColor: 'transparent',
            frameBoxShadowCssValue: 'none',
            editorActiveTabIndicatorTopColor: 'transparent',
            editorActiveTabIndicatorBottomColor: 'var(--sl-color-accent)',
            editorTabBarBorderBottomColor: 'var(--sl-color-hairline)',
            terminalTitlebarDotsOpacity: '0',
            terminalTitlebarBorderBottomColor: 'transparent',
            terminalTitlebarBackground: 'var(--ec-codeBg)',
            terminalBackground: 'var(--ec-codeBg)',
            inlineButtonBorder: 'var(--sl-color-hairline)',
          },
        },
      },
      sidebar: [
        {
          label: 'Start here',
          items: [{ slug: 'getting-started' }, { slug: 'concepts' }, { slug: 'examples' }],
        },
        {
          label: 'Guides',
          items: [
            { slug: 'guides/targets' },
            { slug: 'guides/steps' },
            { slug: 'guides/manager' },
            { slug: 'guides/triggers-and-conditions' },
            { slug: 'guides/routes-and-persistence' },
            { slug: 'guides/events-and-hooks' },
            { slug: 'guides/devtools' },
          ],
        },
        {
          label: 'Customize',
          items: [
            { slug: 'customize/themes' },
            { slug: 'customize/theming' },
            { slug: 'customize/arrows-and-spotlight' },
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
        {
          label: 'Reference',
          items: [
            { slug: 'reference/schema' },
            { slug: 'reference/api' },
            { slug: 'reference/for-ai' },
          ],
        },
      ],
    }),
  ],
})
