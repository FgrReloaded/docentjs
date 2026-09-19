import { minimal } from '@docentjs/dom/themes'
import { DocentProvider, useTour } from '@docentjs/react'
import { TourCard } from './TourCard'
import { customTour, themedTour, welcomeTour } from './tours'

function Page() {
  const welcome = useTour(welcomeTour)
  const custom = useTour(customTour, { popover: (ctx) => <TourCard ctx={ctx} /> })
  const themed = useTour(themedTour)

  return (
    <>
      <header>
        <span className="brand">Acme</span>
        <span className="spacer" />
        <button type="button" onClick={() => welcome.start()}>
          Built-in tour
        </button>
        <button type="button" onClick={() => custom.start()}>
          Custom popover
        </button>
        <button type="button" onClick={() => themed.start()}>
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
              Tour status: <b>{welcome.state.status}</b> / <b>{custom.state.status}</b> /{' '}
              <b>{themed.state.status}</b>
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
    </>
  )
}

export function App() {
  return (
    <DocentProvider
      renderer={{
        templates: { minimal: { theme: minimal } },
      }}
      sink={{ emit: (e) => console.log('[docent]', e.type, e.stepId ?? '') }}
    >
      <Page />
    </DocentProvider>
  )
}
