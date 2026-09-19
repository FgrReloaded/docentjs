import { DocentDevtools } from '@docentjs/devtools/react'
import { DocentProvider, useDocent, useTour } from '@docentjs/react'
import { minimal } from '@docentjs/react/themes'
import { TourCard } from './TourCard'
import { customTour, themedTour, welcomeTour } from './tours'

function Page() {
  // The manager runs tours from their rules: the welcome tour starts itself on page load.
  const docent = useDocent({ tours: [welcomeTour, themedTour] })
  // A single tour on demand, drawn with our own React component.
  const custom = useTour(customTour, { popover: (ctx) => <TourCard ctx={ctx} /> })

  return (
    <>
      <header>
        <span className="brand">Acme</span>
        <span className="spacer" />
        <button type="button" onClick={() => docent.start(welcomeTour.id)}>
          Built-in tour
        </button>
        <button type="button" onClick={() => custom.start()}>
          Custom popover
        </button>
        <button type="button" onClick={() => docent.start(themedTour.id)}>
          Themed
        </button>
      </header>
      <div className="layout">
        <aside data-docent="sidebar">
          <a href="#dashboard">Dashboard</a>
          <a href="#projects">Projects</a>
          <a href="#team">Team</a>
        </aside>
        <main>
          <div className="toolbar">
            <button type="button" id="new-project" className="primary">
              New project
            </button>
            <button type="button" id="import">
              Import
            </button>
            <button type="button" id="export">
              Export
            </button>
          </div>
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Welcome back</h2>
            <p>
              Manager: <b>{docent.state.active ?? 'idle'}</b> · Custom tour:{' '}
              <b>{custom.state.status}</b>
            </p>
          </div>
          <div className="card far">
            <label>
              Search projects
              <br />
              <input id="search" placeholder="Type anything" />
            </label>
          </div>
        </main>
      </div>
      {custom.portal}
      {/* Development only: renders nothing and is removed from production builds. */}
      <DocentDevtools docent={docent} />
    </>
  )
}

export function App() {
  return (
    <DocentProvider
      renderer={{ templates: { minimal: { theme: minimal } } }}
      sink={{ emit: (e) => console.log('[docent]', e.type, e.stepId ?? '') }}
    >
      <Page />
    </DocentProvider>
  )
}
