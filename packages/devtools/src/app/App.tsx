/** @jsxImportSource preact */
import { useRef } from 'preact/hooks'
import type { Dock, Store, Tab } from './store'
import { AuditTab, auditCount } from './tabs/Audit'
import { EditTab } from './tabs/Edit'
import { EventsTab } from './tabs/Events'
import { PerfTab } from './tabs/Perf'
import { SimulateTab } from './tabs/Simulate'
import { ToursTab } from './tabs/Tours'
import { IconButton } from './ui'

const TABS: ReadonlyArray<readonly [Tab, string]> = [
  ['tours', 'Tours'],
  ['edit', 'Edit'],
  ['simulate', 'Simulate'],
  ['events', 'Events'],
  ['audit', 'Audit'],
  ['perf', 'Perf'],
]

const NEXT_DOCK: Record<Dock, Dock> = { right: 'bottom', bottom: 'left', left: 'right' }
const DOCK_ICON = { right: 'dockRight', bottom: 'dockBottom', left: 'dockLeft' } as const

export function App({ store }: { store: Store }) {
  const open = store.open.value
  const dock = store.dock.value
  const active = store.state.value.active
  if (!open) {
    return (
      <button
        type="button"
        class="toggle"
        title="Docent devtools (Alt+Shift+D)"
        onClick={() => (store.open.value = true)}
      >
        <span class={`dot ${active ? 'on' : ''}`} />
        Docent
      </button>
    )
  }
  const vertical = dock !== 'bottom'
  const style = vertical ? { width: `${store.size.value}px` } : { height: `${store.size.value}px` }
  return (
    <div
      class={`panel dock-${dock} ${store.picking.value ? 'picking' : ''}`}
      role="dialog"
      aria-label="Docent devtools"
      style={style}
    >
      <Resizer store={store} />
      <header class="bar">
        <span class="logo" aria-hidden="true" />
        <span class="title">Docent</span>
        <span class="muted small">{store.tours.value.length} tours</span>
        <span class="grow" />
        <IconButton
          icon={DOCK_ICON[NEXT_DOCK[dock]]}
          label={`Dock ${NEXT_DOCK[dock]}`}
          onClick={() => {
            store.dock.value = NEXT_DOCK[dock]
            store.size.value = NEXT_DOCK[dock] === 'bottom' ? 340 : 420
          }}
        />
        <IconButton icon="close" label="Close" onClick={() => (store.open.value = false)} />
      </header>
      <NowBar store={store} />
      <div class="tabs" role="tablist">
        {TABS.map(([id, label]) => (
          <button
            type="button"
            role="tab"
            key={id}
            aria-selected={store.tab.value === id}
            onClick={() => (store.tab.value = id)}
          >
            {label}
            {id === 'audit' && <AuditPill store={store} />}
          </button>
        ))}
      </div>
      <div class="body">
        {store.tab.value === 'tours' && <ToursTab store={store} />}
        {store.tab.value === 'edit' && <EditTab store={store} />}
        {store.tab.value === 'simulate' && <SimulateTab store={store} />}
        {store.tab.value === 'events' && <EventsTab store={store} />}
        {store.tab.value === 'audit' && <AuditTab store={store} />}
        {store.tab.value === 'perf' && <PerfTab store={store} />}
      </div>
    </div>
  )
}

function AuditPill({ store }: { store: Store }) {
  store.tick.value
  const { errors, warnings } = auditCount(store)
  if (!errors && !warnings) return null
  return <span class={`pill ${errors ? 'bad' : 'warn'}`}>{errors || warnings}</span>
}

function NowBar({ store }: { store: Store }) {
  store.tick.value
  const active = store.state.value.active
  const controller = store.docent.activeController
  if (!active || !controller) {
    return (
      <div class="now">
        <span class="label muted">No tour running</span>
      </div>
    )
  }
  const state = controller.getState()
  const tour = controller.tour
  const step = tour.steps[state.index]
  return (
    <div class="now">
      <span class="live" />
      <span class="label">
        <strong>{tour.name ?? tour.id}</strong> · step {state.index + 1}/{tour.steps.length}{' '}
        <span class="mono muted">{step?.id}</span>
        {state.status === 'paused' && <span class="muted"> (paused)</span>}
      </span>
      <IconButton icon="prev" label="Back" onClick={() => void controller.back()} />
      <IconButton icon="next" label="Next" onClick={() => void controller.next()} />
      <IconButton
        icon="edit"
        label="Edit this step"
        onClick={() => store.select(tour.id, step?.id, 'edit')}
      />
      <button type="button" class="btn ghost" onClick={() => void store.docent.stop()}>
        Stop
      </button>
    </div>
  )
}

function Resizer({ store }: { store: Store }) {
  const start = useRef<{ pos: number; size: number } | null>(null)
  const dock = store.dock.value
  const onDown = (e: PointerEvent) => {
    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)
    start.current = { pos: dock === 'bottom' ? e.clientY : e.clientX, size: store.size.value }
  }
  const onMove = (e: PointerEvent) => {
    const s = start.current
    if (!s) return
    const pos = dock === 'bottom' ? e.clientY : e.clientX
    const delta = dock === 'right' || dock === 'bottom' ? s.pos - pos : pos - s.pos
    const max = dock === 'bottom' ? window.innerHeight - 80 : window.innerWidth - 80
    store.size.value = Math.round(
      Math.min(max, Math.max(dock === 'bottom' ? 200 : 320, s.size + delta)),
    )
  }
  return (
    <div
      class="resizer"
      aria-hidden="true"
      title="Drag to resize"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={() => (start.current = null)}
    />
  )
}
