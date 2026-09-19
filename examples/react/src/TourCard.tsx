import type { RenderContext } from '@docentjs/core'
import { useState } from 'react'

/** A fully custom popover. Receives the render context, owns its own state. */
export function TourCard({ ctx }: { ctx: RenderContext }) {
  const [liked, setLiked] = useState(false)
  const { step, progress, actions, isLast, canGoBack } = ctx
  return (
    <div className="tour-card">
      <h3>{step.title}</h3>
      {step.body && <p>{step.body}</p>}
      <footer>
        <span className="dots">
          {Array.from({ length: progress.total }, (_, i) => (
            <i key={String(i)} className={i + 1 === progress.current ? 'on' : ''} />
          ))}
        </span>
        <button type="button" onClick={() => setLiked((v) => !v)} aria-pressed={liked}>
          {liked ? '♥' : '♡'}
        </button>
        {canGoBack && (
          <button type="button" onClick={actions.back}>
            Back
          </button>
        )}
        <button type="button" className="primary" onClick={actions.next}>
          {isLast ? 'Done' : 'Next'}
        </button>
      </footer>
    </div>
  )
}
