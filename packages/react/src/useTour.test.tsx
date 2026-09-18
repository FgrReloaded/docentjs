// @vitest-environment jsdom
import { defineTour, type RenderContext } from '@docentjs/core'
import { act, render, renderHook, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { DocentProvider, Tour } from './components'
import { useTour } from './useTour'

const tour = defineTour({
  id: 'react-test',
  steps: [
    { id: 'a', title: 'First' },
    { id: 'b', title: 'Second' },
  ],
})

const host = () => document.querySelector('[data-docent-host]')

afterEach(() => {
  document.body.innerHTML = ''
})

describe('useTour', () => {
  it('controls a tour and exposes live state', async () => {
    const { result, unmount } = renderHook(() => useTour(tour))
    expect(result.current.state.status).toBe('idle')
    expect(result.current.active).toBe(false)

    await act(() => result.current.start())
    expect(result.current.state).toMatchObject({ status: 'running', index: 0 })
    expect(result.current.active).toBe(true)
    expect(host()?.shadowRoot?.querySelector('.title')?.textContent).toBe('First')

    await act(() => result.current.next())
    expect(result.current.state.index).toBe(1)

    await act(() => result.current.next())
    expect(result.current.state.status).toBe('completed')
    expect(host()).toBeNull()

    unmount()
  })

  it('destroys the controller on unmount', async () => {
    const { result, unmount } = renderHook(() => useTour(tour))
    await act(() => result.current.start())
    expect(host()).not.toBeNull()
    unmount()
    expect(host()).toBeNull()
  })

  it('keeps the same controller across re-renders', async () => {
    const { result, rerender } = renderHook(() => useTour(tour, { renderer: { gap: 4 } }))
    const first = result.current.controller
    rerender()
    expect(result.current.controller).toBe(first)
  })

  it('renders a custom popover through a portal with app context', async () => {
    const Card = ({ ctx }: { ctx: RenderContext }) => (
      <div data-testid="card">
        <b>{ctx.step.title}</b> ({ctx.progress.current}/{ctx.progress.total})
        <button type="button" onClick={ctx.actions.next}>
          go
        </button>
      </div>
    )
    function App() {
      const t = useTour(tour, { popover: (ctx) => <Card ctx={ctx} /> })
      return (
        <div>
          <button type="button" onClick={() => t.start()}>
            start
          </button>
          {t.portal}
        </div>
      )
    }
    render(<App />)
    await act(async () => {
      screen.getByText('start').click()
    })
    const card = screen.getByTestId('card')
    expect(card.textContent).toContain('First (1/2)')
    expect(card.closest('[data-docent-popover]')).not.toBeNull()
    expect(host()?.shadowRoot?.querySelector('.popover.headless')).not.toBeNull()

    await act(async () => {
      screen.getByText('go').click()
    })
    expect(screen.getByTestId('card').textContent).toContain('Second (2/2)')
  })
})

describe('DocentProvider and Tour', () => {
  it('applies provider defaults and auto-starts', async () => {
    render(
      <DocentProvider renderer={{ theme: { accent: 'hotpink' } }}>
        <Tour tour={tour} autoStart>
          {(t) => <span data-testid="status">{t.state.status}</span>}
        </Tour>
      </DocentProvider>,
    )
    await act(async () => {})
    expect(screen.getByTestId('status').textContent).toBe('running')
    expect((host() as HTMLElement).style.getPropertyValue('--docent-accent')).toBe('hotpink')
  })
})
