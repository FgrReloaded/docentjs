/** @jsxImportSource preact */
import type { TraitValue } from '@docentjs/core'
import { useState } from 'preact/hooks'
import type { Store } from '../store'
import { Badge, Button, Field, Section } from '../ui'

export function SimulateTab({ store }: { store: Store }) {
  const { docent } = store
  store.tick.value
  const env = docent.getConditionEnv()
  const [user, setUser] = useState(env.identity.id ?? '')
  const [traits, setTraits] = useState(JSON.stringify(env.identity.traits, null, 2))
  const [error, setError] = useState('')
  const [event, setEvent] = useState('')
  const [path, setPath] = useState(env.route ?? '/')

  const apply = () => {
    let parsed: Record<string, TraitValue>
    try {
      parsed = JSON.parse(traits || '{}')
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('Traits must be a JSON object')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON')
      return
    }
    setError('')
    void docent.identify(user.trim() || undefined, parsed).then(() => store.tick.value++)
  }

  return (
    <div class="stack">
      <Section title="Identity">
        <Field label="User id">
          <input
            value={user}
            placeholder="anonymous"
            onInput={(e) => setUser((e.target as HTMLInputElement).value)}
          />
        </Field>
        <Field label="Traits (JSON)">
          <textarea
            rows={5}
            class="mono"
            value={traits}
            onInput={(e) => setTraits((e.target as HTMLTextAreaElement).value)}
          />
        </Field>
        <div class="error">{error}</div>
        <div class="actions">
          <Button variant="primary" onClick={apply}>
            Apply identity
          </Button>
        </div>
      </Section>
      <Section title="Fire an event (track)">
        <div class="inline">
          <input
            class="mono"
            value={event}
            placeholder="invoice-saved"
            onInput={(e) => setEvent((e.target as HTMLInputElement).value)}
          />
          <Button onClick={() => event.trim() && docent.track(event.trim())}>Track</Button>
        </div>
      </Section>
      <Section title={`Navigate (now ${env.route ?? '/'})`}>
        <div class="inline">
          <input
            class="mono"
            value={path}
            placeholder="/path"
            onInput={(e) => setPath((e.target as HTMLInputElement).value)}
          />
          <Button
            onClick={() => {
              if (!path.trim()) return
              history.pushState({}, '', path.trim())
              void docent.refresh().then(() => store.tick.value++)
            }}
          >
            Go
          </Button>
        </div>
      </Section>
      <Section
        title="Progress for this user"
        actions={
          <Button
            variant="ghost"
            onClick={() => void docent.reset().then(() => store.tick.value++)}
          >
            Reset progress for all tours
          </Button>
        }
      >
        {store.tours.value.map((t) => {
          const state = docent.tourState(t.id)
          return (
            <div class="row" key={t.id}>
              <span class="grow">{t.name ?? t.id}</span>
              <Badge
                tone={
                  state === 'completed'
                    ? 'running'
                    : state === 'in-progress'
                      ? 'eligible'
                      : state === 'skipped'
                        ? 'waiting'
                        : 'manual'
                }
              >
                {state}
              </Badge>
              <Button
                variant="ghost"
                onClick={() => void docent.reset(t.id).then(() => store.tick.value++)}
              >
                Reset
              </Button>
            </div>
          )
        })}
      </Section>
    </div>
  )
}
