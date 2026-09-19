/** @jsxImportSource preact */
import { useState } from 'preact/hooks'
import type { Store } from '../store'
import { Button, copyText, Empty, Select } from '../ui'

type Filter = 'all' | 'tour' | 'step' | 'problems'

export function EventsTab({ store }: { store: Store }) {
  const [filter, setFilter] = useState<Filter>('all')
  const all = store.events.value
  const list = all.filter(({ event: e }) => {
    if (filter === 'tour') return e.type.startsWith('tour:')
    if (filter === 'step') return e.type.startsWith('step:')
    if (filter === 'problems')
      return e.type === 'step:missing' || e.type === 'tour:aborted' || e.type === 'step:skipped'
    return true
  })
  return (
    <div class="stack">
      <div class="toolbar">
        <Select<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            ['all', 'All events'],
            ['tour', 'Tour events'],
            ['step', 'Step events'],
            ['problems', 'Problems'],
          ]}
        />
        <span class="grow" />
        <Button onClick={() => (store.events.value = [])}>Clear</Button>
        <Button
          onClick={() =>
            copyText(
              JSON.stringify(
                list.map((e) => e.event),
                null,
                2,
              ),
            )
          }
        >
          Copy JSON
        </Button>
      </div>
      {list.length === 0 && (
        <Empty>
          {all.length === 0 ? 'No events yet. Start a tour.' : 'No events match this filter.'}
        </Empty>
      )}
      <div class="events">
        {[...list].reverse().map(({ id, at, event: e }) => (
          <div class={`event ${e.type.replace(':', '-')}`} key={id}>
            <span class="mono muted">+{((at - store.mountedAt) / 1000).toFixed(1)}s</span>
            <span>
              <strong>{e.type}</strong> {e.tourId}
              {e.stepId && <span class="mono muted"> · {e.stepId}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
