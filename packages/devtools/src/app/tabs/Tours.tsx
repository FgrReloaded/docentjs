/** @jsxImportSource preact */
import type { Tour } from '@docentjs/core'
import { useState } from 'preact/hooks'
import { explainTour } from '../../explain'
import { checkTarget } from '../../targets'
import type { Store } from '../store'
import { Button, copyText, Empty, Icon, IconButton, Mark } from '../ui'

export function ToursTab({ store }: { store: Store }) {
  store.tick.value
  const q = store.query.value.trim().toLowerCase()
  const list = store.tours.value.filter(
    (t) => !q || t.id.toLowerCase().includes(q) || (t.name ?? '').toLowerCase().includes(q),
  )
  return (
    <div class="stack">
      <label class="search">
        <Icon name="search" />
        <input
          placeholder="Filter tours"
          value={store.query.value}
          onInput={(e) => (store.query.value = (e.target as HTMLInputElement).value)}
        />
      </label>
      {store.tours.value.length === 0 && <Empty>No tours registered with this manager.</Empty>}
      {store.tours.value.length > 0 && list.length === 0 && <Empty>No tour matches “{q}”.</Empty>}
      {list.map((t) => (
        <TourCard key={t.id} store={store} tour={t} />
      ))}
    </div>
  )
}

function TourCard({ store, tour }: { store: Store; tour: Tour }) {
  const [open, setOpen] = useState(false)
  const { docent } = store
  const x = explainTour(docent, tour)
  const route = docent.getConditionEnv().route
  const edited = store.edited.value.has(tour.id)
  return (
    <div class={`card ${open ? 'open' : ''}`}>
      <button type="button" class="head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span class="chev">{open ? '▾' : '▸'}</span>
        <span class="name" title={tour.id}>
          {tour.name ?? tour.id}
        </span>
        {edited && <span class="dot" title="Edited in devtools" />}
        <span class={`badge ${x.verdict}`}>{x.verdict}</span>
      </button>
      <div class="summary">{x.summary}</div>
      {open && (
        <div class="detail">
          <h4>Trigger</h4>
          <div class="row">
            <Mark ok={x.trigger.holds} />
            <span class="grow">{x.trigger.text}</span>
          </div>
          <h4>Frequency</h4>
          <div class="row">
            <Mark ok={x.frequency.allows} />
            <span class="grow">
              {x.frequency.rule}; this user: {x.frequency.state}
            </span>
          </div>
          <h4>Conditions</h4>
          {x.conditions.length === 0 && <div class="row muted">none, everyone qualifies</div>}
          {x.conditions.map((c) => (
            <div class="row" key={c.text}>
              <Mark ok={c.passed} />
              <span class="grow">{c.text}</span>
            </div>
          ))}
          <h4>Steps ({tour.steps.length})</h4>
          {tour.steps.map((step, i) => {
            const health = checkTarget(step, route)
            const ok = health.status === 'found' ? true : health.status === 'missing' ? false : null
            return (
              // biome-ignore lint/a11y/noStaticElementInteractions: hover only previews the target outline; the actions are the buttons inside
              <div
                class="row step-row"
                key={step.id}
                onMouseEnter={() => store.highlight(health.element)}
                onMouseLeave={() => store.highlight(null)}
              >
                <span class="index mono">{String(i + 1).padStart(2, '0')}</span>
                <Mark ok={ok} />
                <span class="grow">
                  <span class="mono">{step.id}</span>
                  {step.title ? ` · ${step.title}` : ''}
                  <br />
                  <span class="muted">{health.text}</span>
                </span>
                <IconButton
                  icon="edit"
                  label="Edit this step"
                  onClick={() => store.select(tour.id, step.id, 'edit')}
                />
                <button
                  type="button"
                  class="btn icon-only ghost"
                  title="Play from this step"
                  aria-label="Play from this step"
                  onClick={() => void docent.start(tour.id, { at: step.id })}
                >
                  ▶
                </button>
              </div>
            )
          })}
          <div class="actions">
            <Button variant="primary" icon="play" onClick={() => void docent.start(tour.id)}>
              Play
            </Button>
            <Button icon="edit" onClick={() => store.select(tour.id, undefined, 'edit')}>
              Edit
            </Button>
            <Button onClick={() => void docent.reset(tour.id)}>Reset progress</Button>
            <Button onClick={() => copyText(JSON.stringify(tour, null, 2))}>Copy JSON</Button>
          </div>
        </div>
      )}
    </div>
  )
}
