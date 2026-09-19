import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://docentjs.dev',
  devToolbar: { enabled: false },
  integrations: [
    starlight({
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
        { label: 'Start here', items: [{ slug: 'getting-started' }, { slug: 'concepts' }] },
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
        { label: 'Reference', items: [{ slug: 'reference/schema' }, { slug: 'reference/api' }] },
      ],
    }),
  ],
})
