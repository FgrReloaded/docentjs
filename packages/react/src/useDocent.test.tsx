// @vitest-environment jsdom
import { createMemoryStorage, defineTour, type RenderContext } from '@docentjs/core'
import { act, render, renderHook, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { DocentProvider } from './components'
import { useDocent } from './useDocent'

const settle = async () => {
  for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0))
}

const tours = [
  defineTour({ id: 'welcome', trigger: { type: 'auto' }, steps: [{ id: 'a', title: 'Hello' }] }),
  defineTour({ id: 'help', steps: [{ id: 'h', title: 'Help' }] }),
]

afterEach(() => {
  document.body.innerHTML = ''
})

describe('useDocent', () => {
  it('runs auto tours, exposes state and destroys on unmount', async () => {
    const { result, unmount } = renderHook(() =>
      useDocent({ tours, storage: createMemoryStorage() }),
    )
    await act(settle)
    expect(result.current.state).toEqual({ active: 'welcome', tours: ['welcome', 'help'] })
    const host = () => document.querySelector('[data-docent-host]')
    expect(host()?.shadowRoot?.querySelector('.title')?.textContent).toBe('Hello')

    await act(async () => {
      await result.current.start('help')
    })
    expect(result.current.state.active).toBe('help')
    unmount()
    expect(host()).toBeNull()
  })

  it('renders a custom popover and inherits provider defaults', async () => {
    const Card = ({ ctx }: { ctx: RenderContext }) => <div data-testid="card">{ctx.step.title}</div>
    function App() {
      const d = useDocent({
        tours,
        storage: createMemoryStorage(),
        popover: (ctx) => <Card ctx={ctx} />,
      })
      return <>{d.portal}</>
    }
    render(
      <DocentProvider renderer={{ theme: { accent: 'hotpink' } }}>
        <App />
      </DocentProvider>,
    )
    await act(settle)
    expect(screen.getByTestId('card').textContent).toBe('Hello')
    const host = document.querySelector('[data-docent-host]') as HTMLElement
    expect(host.style.getPropertyValue('--docent-accent')).toBe('hotpink')
  })
})
