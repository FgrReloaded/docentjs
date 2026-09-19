/** @jsxImportSource preact */
import { auditTours, type Issue, type Severity } from '../../audit'
import type { Store } from '../store'
import { Empty } from '../ui'

const LABEL: Record<Severity, string> = { error: 'Error', warning: 'Warning', info: 'Note' }

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

export function auditCount(store: Store): { errors: number; warnings: number } {
  const issues = auditTours(store.docent, store.tours.value)
  return {
    errors: issues.filter((i) => i.severity === 'error').length,
    warnings: issues.filter((i) => i.severity === 'warning').length,
  }
}

export function AuditTab({ store }: { store: Store }) {
  store.tick.value
  const issues = auditTours(store.docent, store.tours.value)
  if (issues.length === 0)
    return <Empty>No issues found. Every target resolves and the tours look healthy.</Empty>
  const counts = (s: Severity) => issues.filter((i) => i.severity === s).length
  const byTour = new Map<string, Issue[]>()
  for (const i of issues) byTour.set(i.tourId, [...(byTour.get(i.tourId) ?? []), i])
  const name = (id: string) => store.tours.value.find((t) => t.id === id)?.name ?? id

  return (
    <div class="stack">
      <div class="audit-summary">
        <span class={counts('error') ? 'bad' : 'muted'}>{plural(counts('error'), 'error')}</span>
        <span class={counts('warning') ? 'warn' : 'muted'}>
          {plural(counts('warning'), 'warning')}
        </span>
        <span class="muted">{plural(counts('info'), 'note')}</span>
        <span class="muted small grow right">Checks run against the current page.</span>
      </div>
      {[...byTour].map(([tourId, list]) => (
        <div class="card" key={tourId}>
          <div class="head static">
            <span class="name">{name(tourId)}</span>
          </div>
          {list.map((issue) => (
            <button
              type="button"
              class={`issue ${issue.severity}`}
              key={`${issue.stepId ?? ''}|${issue.message}`}
              onClick={() => store.select(issue.tourId, issue.stepId, 'edit')}
              title="Open in the editor"
            >
              <span class={`sev ${issue.severity}`}>{LABEL[issue.severity]}</span>
              <span class="grow">
                {issue.stepId && <span class="mono muted">{issue.stepId} · </span>}
                {issue.message}
                {issue.hint && <span class="hint">{issue.hint}</span>}
              </span>
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
