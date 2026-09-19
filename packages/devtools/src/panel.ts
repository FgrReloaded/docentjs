/**
 * The devtools panel. Vanilla DOM in its own shadow root, so it works in any
 * framework and cannot be styled by the page.
 */

import type { Docent, DocentEvent, TraitValue } from '@docentjs/core'
import { explainTour, type TourExplanation } from './explain'
import { h } from './h'
import { HIGHLIGHT_STYLE, STYLES } from './styles'
import { checkTarget } from './targets'

export interface MountOptions {
  /** Start with the panel open. Default: remembered per tab, else closed. */
  open?: boolean
  /** Keyboard shortcut to toggle the panel. Default Alt+Shift+D. Set false to disable. */
  shortcut?:
    | false
    | { key: string; altKey?: boolean; shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean }
  /** Document to mount into. */
  document?: Document
}

type Tab = 'tours' | 'simulate' | 'events'

interface LoggedEvent {
  at: number
  event: DocentEvent
}

const OPEN_KEY = 'docent-devtools-open'
const MAX_EVENTS = 300

function remembered(): boolean | undefined {
  try {
    const v = sessionStorage.getItem(OPEN_KEY)
    return v === null ? undefined : v === '1'
  } catch {
    return undefined
  }
}

function remember(open: boolean): void {
  try {
    sessionStorage.setItem(OPEN_KEY, open ? '1' : '0')
  } catch {}
}

function copy(text: string): void {
  void navigator.clipboard?.writeText(text).catch(() => {})
}

/**
 * Mount the devtools panel for a tour manager. Returns a function that removes
 * it. Load it only in development:
 *
 * ```ts
 * if (import.meta.env.DEV) import('@docentjs/devtools').then((d) => d.mount(docent))
 * ```
 */
export function mount(docent: Docent, options: MountOptions = {}): () => void {
  const doc = options.document ?? document
  const host = doc.createElement('div')
  host.setAttribute('data-docent-devtools', '')
  host.setAttribute('data-docent-ignore-keys', '')
  const shadow = host.attachShadow({ mode: 'open' })
  shadow.append(h('style', {}, STYLES))
  const root = h('div', { class: 'root' })
  shadow.append(root)
  doc.body.appendChild(host)

  const mountedAt = Date.now()
  const events: LoggedEvent[] = []
  const expanded = new Set<string>()
  let tab: Tab = 'tours'
  let open = options.open ?? remembered() ?? false
  let lastSignature = ''
  const cleanups: Array<() => void> = []

  // ---------------------------------------------------------------------------
  // Highlight a target on the page
  // ---------------------------------------------------------------------------

  const highlight = doc.createElement('div')
  highlight.setAttribute('data-docent-devtools-highlight', '')
  highlight.style.cssText = `${HIGHLIGHT_STYLE};display:none`
  doc.body.appendChild(highlight)
  const showHighlight = (el: Element | null) => {
    if (!el) return
    const r = el.getBoundingClientRect()
    Object.assign(highlight.style, {
      display: 'block',
      left: `${r.left - 3}px`,
      top: `${r.top - 3}px`,
      width: `${r.width + 6}px`,
      height: `${r.height + 6}px`,
    })
  }
  const hideHighlight = () => {
    highlight.style.display = 'none'
  }

  // ---------------------------------------------------------------------------
  // Structure
  // ---------------------------------------------------------------------------

  const dot = h('span', { class: 'dot' })
  const toggle = h(
    'button',
    {
      class: 'toggle',
      type: 'button',
      title: 'Docent devtools (Alt+Shift+D)',
      onclick: () => setOpen(!open),
    },
    dot,
    'Docent',
  )
  const now = h('div', { class: 'now' })
  const body = h('div', { class: 'body' })
  const tabButtons = (['tours', 'simulate', 'events'] as const).map((t) =>
    h(
      'button',
      { type: 'button', role: 'tab', onclick: () => setTab(t) },
      t[0]?.toUpperCase() + t.slice(1),
    ),
  )
  const panel = h(
    'div',
    { class: 'panel', role: 'dialog', 'aria-label': 'Docent devtools' },
    h(
      'header',
      {},
      h('span', { class: 'title' }, 'Docent devtools'),
      h(
        'button',
        { class: 'btn icon', type: 'button', 'aria-label': 'Close', onclick: () => setOpen(false) },
        '×',
      ),
    ),
    now,
    h('div', { class: 'tabs', role: 'tablist' }, ...tabButtons),
    body,
  )
  root.append(toggle, panel)

  function setOpen(value: boolean) {
    open = value
    remember(open)
    render(true)
  }

  function setTab(value: Tab) {
    tab = value
    render(true)
  }

  // ---------------------------------------------------------------------------
  // Running tour controls
  // ---------------------------------------------------------------------------

  function renderNow() {
    const activeId = docent.getState().active
    const controller = docent.activeController
    dot.classList.toggle('on', !!activeId)
    now.replaceChildren()
    if (!activeId || !controller) {
      now.append(h('span', { class: 'label muted' }, 'No tour running'))
      return
    }
    const state = controller.getState()
    const tour = controller.tour
    const step = tour.steps[state.index]
    now.append(
      h(
        'span',
        { class: 'label' },
        h('strong', {}, tour.name ?? tour.id),
        ` · step ${state.index + 1}/${tour.steps.length} `,
        h('span', { class: 'mono muted' }, step?.id ?? ''),
        state.status === 'paused' ? h('span', { class: 'muted' }, ' (paused)') : null,
      ),
      h(
        'button',
        { class: 'btn icon', type: 'button', title: 'Back', onclick: () => void controller.back() },
        '‹',
      ),
      h(
        'button',
        { class: 'btn icon', type: 'button', title: 'Next', onclick: () => void controller.next() },
        '›',
      ),
      h('button', { class: 'btn', type: 'button', onclick: () => void docent.stop() }, 'Stop'),
    )
  }

  // ---------------------------------------------------------------------------
  // Tours tab
  // ---------------------------------------------------------------------------

  function tourCard(x: TourExplanation) {
    const { tour } = x
    const isOpen = expanded.has(tour.id)
    const route = docent.getConditionEnv().route
    const card = h(
      'div',
      { class: 'card' },
      h(
        'div',
        {
          class: 'head',
          onclick: () => {
            if (isOpen) expanded.delete(tour.id)
            else expanded.add(tour.id)
            render(true)
          },
        },
        h('span', { class: 'muted' }, isOpen ? '▾' : '▸'),
        h('span', { class: 'name', title: tour.id }, tour.name ?? tour.id),
        h('span', { class: `badge ${x.verdict}` }, x.verdict),
      ),
      h('div', { class: 'summary' }, x.summary),
    )
    if (!isOpen) return card

    const detail = h('div', { class: 'detail' })
    detail.append(
      h('h4', {}, 'Trigger'),
      h(
        'div',
        { class: 'row' },
        mark(x.trigger.holds),
        h('span', { class: 'grow' }, x.trigger.text),
      ),
      h('h4', {}, 'Frequency'),
      h(
        'div',
        { class: 'row' },
        mark(x.frequency.allows),
        h('span', { class: 'grow' }, `${x.frequency.rule}; this user: ${x.frequency.state}`),
      ),
      h('h4', {}, 'Conditions'),
    )
    if (x.conditions.length === 0)
      detail.append(h('div', { class: 'row muted' }, 'none, everyone qualifies'))
    for (const c of x.conditions)
      detail.append(
        h('div', { class: 'row' }, mark(c.passed), h('span', { class: 'grow' }, c.text)),
      )

    detail.append(h('h4', {}, `Steps (${tour.steps.length})`))
    tour.steps.forEach((step, i) => {
      const health = checkTarget(step, route)
      const status = health.status === 'found' ? true : health.status === 'missing' ? false : null
      const row = h(
        'div',
        {
          class: 'row',
          onmouseenter: () => showHighlight(health.element),
          onmouseleave: hideHighlight,
        },
        h('span', { class: 'muted mono' }, String(i + 1).padStart(2, ' ')),
        mark(status),
        h(
          'span',
          { class: 'grow' },
          h('span', { class: 'mono' }, step.id),
          step.title ? ` · ${step.title}` : '',
          h('br'),
          h('span', { class: 'muted' }, health.text),
        ),
        h(
          'button',
          {
            class: 'btn icon',
            type: 'button',
            title: 'Play from this step',
            onclick: () => void docent.start(tour.id, { at: step.id }),
          },
          '▶',
        ),
      )
      detail.append(row)
    })

    detail.append(
      h(
        'div',
        { class: 'actions' },
        h(
          'button',
          { class: 'btn primary', type: 'button', onclick: () => void docent.start(tour.id) },
          'Play',
        ),
        h(
          'button',
          { class: 'btn', type: 'button', onclick: () => void docent.reset(tour.id) },
          'Reset progress',
        ),
        h(
          'button',
          { class: 'btn', type: 'button', onclick: () => copy(JSON.stringify(tour, null, 2)) },
          'Copy JSON',
        ),
      ),
    )
    card.append(detail)
    return card
  }

  function mark(state: boolean | null) {
    if (state === null) return h('span', { class: 'muted' }, '•')
    return h('span', { class: state ? 'ok' : 'bad' }, state ? '✓' : '✗')
  }

  function toursSignature(list: TourExplanation[]): string {
    const route = docent.getConditionEnv().route
    return JSON.stringify([
      [...expanded],
      list.map((x) => [
        x.tour.id,
        x.verdict,
        x.summary,
        x.trigger.holds,
        x.conditions.map((c) => c.passed),
      ]),
      list
        .filter((x) => expanded.has(x.tour.id))
        .map((x) => x.tour.steps.map((s) => checkTarget(s, route).text)),
    ])
  }

  function renderTours(force: boolean) {
    const list = docent.getTours().map((t) => explainTour(docent, t))
    const signature = toursSignature(list)
    if (!force && signature === lastSignature) return
    lastSignature = signature
    const scroll = body.scrollTop
    body.replaceChildren()
    if (list.length === 0) body.append(h('div', { class: 'empty' }, 'No tours registered.'))
    for (const x of list) body.append(tourCard(x))
    body.scrollTop = scroll
  }

  // ---------------------------------------------------------------------------
  // Simulate tab
  // ---------------------------------------------------------------------------

  function renderSimulate() {
    const env = docent.getConditionEnv()
    const userInput = h('input', { value: env.identity.id ?? '', placeholder: 'anonymous' })
    const traitsInput = h('textarea', {}, JSON.stringify(env.identity.traits, null, 2))
    const error = h('div', { class: 'error' })
    const eventInput = h('input', { placeholder: 'invoice-saved' })
    const routeInput = h('input', { value: env.route ?? '/', placeholder: '/path' })

    body.replaceChildren(
      h('label', {}, 'User id'),
      userInput,
      h('label', {}, 'Traits (JSON)'),
      traitsInput,
      error,
      h(
        'div',
        { class: 'actions' },
        h(
          'button',
          {
            class: 'btn primary',
            type: 'button',
            onclick: () => {
              let traits: Record<string, TraitValue>
              try {
                traits = JSON.parse(traitsInput.value || '{}')
                if (typeof traits !== 'object' || traits === null || Array.isArray(traits))
                  throw new Error('Traits must be a JSON object')
              } catch (e) {
                error.textContent = e instanceof Error ? e.message : 'Invalid JSON'
                return
              }
              error.textContent = ''
              void docent
                .identify(userInput.value.trim() || undefined, traits)
                .then(() => render(true))
            },
          },
          'Apply identity',
        ),
      ),
      h('label', {}, 'Fire an event (track)'),
      h(
        'div',
        { class: 'inline' },
        eventInput,
        h(
          'button',
          {
            class: 'btn',
            type: 'button',
            onclick: () => eventInput.value.trim() && docent.track(eventInput.value.trim()),
          },
          'Track',
        ),
      ),
      h('label', {}, 'Navigate (pushState)'),
      h(
        'div',
        { class: 'inline' },
        routeInput,
        h(
          'button',
          {
            class: 'btn',
            type: 'button',
            onclick: () => {
              const path = routeInput.value.trim()
              if (!path) return
              doc.defaultView?.history.pushState({}, '', path)
              void docent.refresh()
            },
          },
          'Go',
        ),
      ),
      h('label', {}, 'Progress'),
      h(
        'div',
        { class: 'actions' },
        h(
          'button',
          { class: 'btn', type: 'button', onclick: () => void docent.reset() },
          'Reset progress for all tours',
        ),
      ),
    )
  }

  // ---------------------------------------------------------------------------
  // Events tab
  // ---------------------------------------------------------------------------

  function renderEvents() {
    const list = h('div', {})
    if (events.length === 0)
      list.append(h('div', { class: 'empty' }, 'No events yet. Start a tour.'))
    for (const { at, event } of [...events].reverse()) {
      list.append(
        h(
          'div',
          { class: 'event' },
          h('span', { class: 'mono muted' }, `+${((at - mountedAt) / 1000).toFixed(1)}s`),
          h(
            'span',
            {},
            h('strong', {}, event.type),
            ` ${event.tourId}`,
            event.stepId ? h('span', { class: 'mono muted' }, ` · ${event.stepId}`) : null,
          ),
        ),
      )
    }
    body.replaceChildren(
      h(
        'div',
        { class: 'actions', style: 'margin: 0 0 8px' },
        h(
          'button',
          {
            class: 'btn',
            type: 'button',
            onclick: () => {
              events.length = 0
              render(true)
            },
          },
          'Clear',
        ),
        h(
          'button',
          {
            class: 'btn',
            type: 'button',
            onclick: () =>
              copy(
                JSON.stringify(
                  events.map((e) => e.event),
                  null,
                  2,
                ),
              ),
          },
          'Copy JSON',
        ),
      ),
      list,
    )
  }

  // ---------------------------------------------------------------------------
  // Render loop
  // ---------------------------------------------------------------------------

  function render(force = false) {
    toggle.hidden = open
    panel.hidden = !open
    renderNow()
    if (!open) return
    const tabs: Tab[] = ['tours', 'simulate', 'events']
    tabButtons.forEach((b, i) => {
      b.setAttribute('aria-selected', String(tabs[i] === tab))
    })
    if (tab === 'tours') renderTours(force)
    else if (force && tab === 'simulate') renderSimulate()
    else if (tab === 'events') renderEvents()
    if (force && tab !== 'tours') lastSignature = ''
  }

  cleanups.push(docent.subscribe(() => render()))
  cleanups.push(
    docent.onEvent((event) => {
      events.push({ at: Date.now(), event })
      if (events.length > MAX_EVENTS) events.shift()
      if (tab === 'events' || tab === 'tours') render()
    }),
  )
  // Targets and routes change without telling anyone; poll cheaply while open.
  const timer = setInterval(() => open && tab === 'tours' && render(), 1000)
  cleanups.push(() => clearInterval(timer))

  const win = doc.defaultView
  const onRoute = () => render()
  win?.addEventListener('popstate', onRoute)
  cleanups.push(() => win?.removeEventListener('popstate', onRoute))

  const shortcut =
    options.shortcut === undefined ? { key: 'D', altKey: true, shiftKey: true } : options.shortcut
  if (shortcut && win) {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === shortcut.key.toLowerCase() &&
        !!e.altKey === !!shortcut.altKey &&
        !!e.shiftKey === !!shortcut.shiftKey &&
        !!e.ctrlKey === !!shortcut.ctrlKey &&
        !!e.metaKey === !!shortcut.metaKey
      ) {
        e.preventDefault()
        setOpen(!open)
      }
    }
    win.addEventListener('keydown', onKey)
    cleanups.push(() => win.removeEventListener('keydown', onKey))
  }

  void docent.ready.then(() => render(true))
  render(true)

  return () => {
    for (const c of cleanups) c()
    host.remove()
    highlight.remove()
  }
}
