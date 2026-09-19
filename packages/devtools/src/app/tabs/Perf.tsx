/** @jsxImportSource preact */
import type { Store } from '../store'
import { Button, Empty } from '../ui'

function tone(ms: number, good: number, bad: number): string {
  return ms <= good ? 'ok' : ms >= bad ? 'bad' : 'warn'
}

export function PerfTab({ store }: { store: Store }) {
  const { steps, missingTargets } = store.perf.value
  const host = document.querySelector('[data-docent-host]')?.shadowRoot
  const nodes = host ? host.querySelectorAll('*').length : 0
  const avg = steps.length ? Math.round(steps.reduce((s, x) => s + x.latency, 0) / steps.length) : 0
  const worst = steps.reduce((m, x) => Math.max(m, x.worstFrame), 0)
  const long = steps.reduce((m, x) => m + x.longFrames, 0)

  return (
    <div class="stack">
      <div class="metrics">
        <div class="metric">
          <span class="label">Steps shown</span>
          <span class="value">{steps.length}</span>
        </div>
        <div class="metric">
          <span class="label">Avg. step time</span>
          <span class={`value ${tone(avg, 50, 300)}`}>{avg} ms</span>
        </div>
        <div class="metric">
          <span class="label">Worst frame</span>
          <span class={`value ${tone(worst, 20, 50)}`}>{worst} ms</span>
        </div>
        <div class="metric">
          <span class="label">Long frames</span>
          <span class={`value ${long ? 'warn' : 'ok'}`}>{long}</span>
        </div>
        <div class="metric">
          <span class="label">Missing targets</span>
          <span class={`value ${missingTargets ? 'warn' : 'ok'}`}>{missingTargets}</span>
        </div>
        <div class="metric">
          <span class="label">Tour DOM nodes</span>
          <span class="value">{nodes}</span>
        </div>
      </div>
      <p class="muted small">
        Step time runs from the click (or tour start) until the step is on screen, including any
        wait for its target. Frames over 50 ms feel janky.
      </p>
      {steps.length === 0 ? (
        <Empty>Play a tour to record timings.</Empty>
      ) : (
        <table class="perf">
          <thead>
            <tr>
              <th>Step</th>
              <th class="num">Time</th>
              <th class="num">Moves</th>
              <th class="num">Worst frame</th>
            </tr>
          </thead>
          <tbody>
            {[...steps].reverse().map((s) => (
              <tr key={s.id}>
                <td>
                  <span class="muted">{s.tourId} · </span>
                  <span class="mono">{s.stepId}</span>
                </td>
                <td class={`num ${tone(s.latency, 50, 300)}`}>{s.latency} ms</td>
                <td class="num">{s.repositions}</td>
                <td class={`num ${tone(s.worstFrame, 20, 50)}`}>{s.worstFrame} ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div class="actions">
        <Button onClick={() => store.recorder.clear()}>Clear</Button>
      </div>
    </div>
  )
}
