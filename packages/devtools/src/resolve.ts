import type { Docent } from '@docentjs/core'

/** Accept the manager or a framework handle that carries it (`useDocent()` results). */
export type DevtoolsTarget = Docent | { docent: Docent } | null | undefined

export function resolveDocent(target: DevtoolsTarget): Docent | undefined {
  if (!target) return undefined
  return 'docent' in target ? target.docent : target
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}
