import { DocentDevtools } from '@docentjs/devtools/react'
import { DocentProvider, type EventSink, useDocent, useTour } from '@docentjs/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DraftDrawer } from './components/DraftDrawer'
import { Figures } from './components/Figures'
import { Ledger } from './components/Ledger'
import { Notes } from './components/Notes'
import { Rail } from './components/Rail'
import { type Period, Topbar } from './components/Topbar'
import { type Invoice, invoices } from './data'
import { TourCard } from './TourCard'
import { rendererDefaults } from './tour-theme'
import { onboardingTour, reconcileTour, releaseTour, remindersTour } from './tours'

/** Where product analytics would go. Every tour event arrives here. */
const analytics: EventSink = {
  emit: (event) => console.debug('[docent]', event.type, event.tourId, event.stepId ?? ''),
}

function matches(invoice: Invoice, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    invoice.client.toLowerCase().includes(q) ||
    invoice.ref.includes(q) ||
    String(invoice.amount).includes(q)
  )
}

function Console() {
  const [period, setPeriod] = useState<Period>('quarter')
  const [query, setQuery] = useState('')
  const [draftOpen, setDraftOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const say = useCallback((message: string) => setToast(message), [])
  const openDraft = useCallback(() => setDraftOpen(true), [])
  const closeDraft = useCallback(() => setDraftOpen(false), [])

  // The manager reads its options once, on mount. Hooks reach the live app
  // through this ref instead of capturing the first render's closures.
  const app = useRef({ openDraft, closeDraft, say })
  app.current = { openDraft, closeDraft, say }

  const docent = useDocent({
    tours: [onboardingTour, remindersTour, releaseTour],
    hooks: {
      [onboardingTour.id]: {
        steps: {
          // The drawer normally opens because the user clicked. If they got
          // here another way, open it so the step has something to point at.
          'draft-total': {
            beforeShow: (): undefined => {
              app.current.openDraft()
            },
          },
          done: {
            beforeShow: (): undefined => {
              app.current.closeDraft()
            },
          },
        },
        onComplete: () => app.current.say('Setup finished — replay it from Guides'),
      },
    },
  })

  // Month-end guide, drawn by our own React component.
  const reconcile = useTour(reconcileTour, { popover: (ctx) => <TourCard ctx={ctx} /> })

  // Traits decide who is eligible: the release note is owners-only.
  useEffect(() => {
    docent.identify('u_2291', { plan: 'studio', role: 'owner', invoices: 128 })
  }, [docent])

  // Lets the docs link straight into a tour: /examples/react/?start=<id>.
  // Both dependencies are stable for the life of their controller, so this
  // runs once rather than on every state change.
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get('start')
    if (!wanted) return
    if (wanted === reconcileTour.id) {
      // The month-end guide runs outside the manager, so stop the manager
      // watching triggers for this visit: the link asked for one tour.
      void docent.docent.disconnect()
      void reconcile.controller.start()
    } else void docent.start(wanted)
  }, [docent, reconcile.controller])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(timer)
  }, [toast])

  const rows = useMemo(() => invoices.filter((invoice) => matches(invoice, query)), [query])

  const sendDraft = () => {
    setDraftOpen(false)
    say('Invoice #1043 sent to Two Rivers Press')
    docent.track('invoice-sent')
  }

  const remind = (invoice: Invoice) => {
    say(`Reminder sent to ${invoice.client}`)
    // Fires the `event` trigger on the reminders tour.
    docent.track('reminder-sent')
  }

  return (
    <>
      <div className="app">
        <Rail
          onSetupTour={() => void docent.start(onboardingTour.id)}
          onReconcileTour={() => {
            // Only one tour at a time, even across two controllers.
            void docent.stop()
            void reconcile.start()
          }}
          onReleaseTour={() => void docent.start(releaseTour.id)}
        />
        <div className="frame">
          <Topbar
            period={period}
            onPeriod={setPeriod}
            query={query}
            onQuery={setQuery}
            onNewInvoice={openDraft}
          />
          <main className="sheet">
            <Figures />
            <div className="columns">
              <Ledger rows={rows} query={query} onRemind={remind} onOpen={openDraft} />
              <Notes />
            </div>
          </main>
        </div>
      </div>

      {draftOpen && <DraftDrawer onClose={closeDraft} onSend={sendDraft} />}

      {toast && (
        <output className="toast">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" fill="none">
            <path
              d="M3 7.4l2.6 2.6L11 4.4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {toast}
        </output>
      )}

      {/* The container the month-end guide renders into. */}
      {reconcile.portal}

      {/* Development only: renders nothing and drops out of production builds. */}
      <DocentDevtools docent={docent} />
    </>
  )
}

export function App() {
  return (
    <DocentProvider renderer={rendererDefaults} sink={analytics}>
      <Console />
    </DocentProvider>
  )
}
