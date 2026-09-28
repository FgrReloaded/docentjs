export const OG_WIDTH = 1200
export const OG_HEIGHT = 630

const sections: Record<string, string> = {
  'getting-started': 'Start here',
  concepts: 'Start here',
  examples: 'Start here',
  guides: 'Guides',
  customize: 'Customize',
  frameworks: 'Frameworks',
  reference: 'Reference',
}

export const sectionOf = (id: string): string | undefined => sections[id.split('/')[0] ?? '']

export const ogImagePath = (id: string) => `/og/${id || 'index'}.png`
