/** @jsxImportSource preact */
/**
 * Pocket: the page at a phone's size, in a frame beside the panel, with the
 * tour running in it. Edits in the panel show up in the frame as they do on
 * the page, so the phone layout can be tuned where it is seen.
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks'
import { POCKET_NAME, POCKET_SIZES } from '../pocket'
import type { Store } from './store'
import { Icon, IconButton } from './ui'

/** Space kept around the phone, in px. */
const AIR = 24
/** The phone's bezel, in px. */
const BEZEL = 10
/** The shortest the phone gets when the window is short, in px. */
const MIN_HEIGHT = 420

export function Pocket({ store }: { store: Store }) {
  const pocket = store.pocket.value
  const stage = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const [room, setRoom] = useState({ width: 0, height: 0 })
  // The page as it is now; kept, so re-renders never reload the frame.
  const [href] = useState(() => (typeof location === 'undefined' ? 'about:blank' : location.href))

  // Known to the store as soon as it is in the page, before it can finish loading.
  useLayoutEffect(() => {
    store.attachPocket(frame.current ?? undefined)
    return () => store.attachPocket(undefined)
  }, [store])
  useEffect(() => {
    const el = stage.current
    if (!el) return
    const measure = () => setRoom({ width: el.clientWidth, height: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  if (!pocket) return null
  const size = POCKET_SIZES[pocket.size] ?? POCKET_SIZES[1]
  if (!size) return null
  const width = pocket.landscape ? size.height : size.width
  const tall = pocket.landscape ? size.width : size.height
  // Never scaled: a scaled frame is drawn soft and small. The width is the
  // phone's own, which is what decides the layout; in a short window the
  // phone is shorter instead, like one with its browser bars showing, and a
  // phone wider than the room scrolls.
  const fits = Math.floor(room.height - AIR * 2 - BEZEL * 2)
  const height = room.height > 0 ? Math.max(MIN_HEIGHT, Math.min(tall, fits)) : tall
  const fitted = height < tall

  // Beside the panel, never under it.
  const dock = store.layout.value
  const panel = `${store.size.value}px`
  const inset = {
    top: '0',
    left: dock === 'left' ? panel : '0',
    right: dock === 'right' ? panel : '0',
    bottom: dock === 'bottom' ? panel : '0',
  }
  const g = store.guest.value
  const running = g && g.index >= 0

  return (
    <section class="pocket" style={inset} aria-label="Pocket: the page at phone size">
      <div class="pocket-bar">
        <span class="pocket-name">
          <Icon name="phone" />
          Pocket
        </span>
        <fieldset class="seg" aria-label="Phone size">
          {POCKET_SIZES.map((s, i) => (
            <button
              type="button"
              key={s.width}
              class="seg-btn wide"
              aria-pressed={pocket.size === i}
              title={`${s.width} × ${s.height} · ${s.hint}`}
              onClick={() => store.pocketSize(i)}
            >
              {s.width}
            </button>
          ))}
        </fieldset>
        <IconButton
          icon="rotate"
          label={pocket.landscape ? 'Turn upright' : 'Turn sideways'}
          aria-pressed={pocket.landscape}
          onClick={() => store.pocketSize(pocket.size, !pocket.landscape)}
        />
        <span
          class="mono muted small"
          title={fitted ? `${tall}px tall on the phone; shorter here to fit the window` : undefined}
        >
          {width} × {height}
          {fitted && ' · fitted'}
        </span>
        <span class="grow" />
        <span class="pocket-status">
          {running ? (
            <>
              <span class="live" />
              <span class="grow">{g.title ?? g.stepId}</span>
              <span class="mono muted">
                {g.index + 1}/{g.total}
              </span>
            </>
          ) : (
            <span class="muted">No tour running</span>
          )}
        </span>
        <IconButton
          icon="prev"
          label="Back"
          disabled={!running}
          onClick={() => store.pocketCommand('back')}
        />
        <IconButton
          icon="next"
          label="Next"
          disabled={!running}
          onClick={() => store.pocketCommand('next')}
        />
        <IconButton
          icon="restart"
          label="Start the selected tour again"
          onClick={() => {
            const sel = store.selection.value
            const tour = store.tours.value.find((t) => t.id === sel.tourId) ?? store.tours.value[0]
            if (tour) store.preview(tour.id, tour.steps[0]?.id)
          }}
        />
        <IconButton icon="close" label="Close Pocket" onClick={() => store.closePocket()} />
      </div>
      <div class="pocket-stage" ref={stage}>
        <div class="device">
          <div class="device-body">
            <div class="screen">
              <iframe
                ref={frame}
                name={POCKET_NAME}
                title="The page at phone size"
                src={href}
                onLoad={() => store.pocketLoaded()}
                width={width}
                height={height}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
