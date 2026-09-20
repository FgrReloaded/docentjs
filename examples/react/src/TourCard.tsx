import type { RenderContext } from '@docentjs/react'

/**
 * A popover the app draws itself (headless mode). Docent still handles the
 * overlay, the spotlight, positioning, focus and keys — everything inside
 * this card is ours, including app state and page CSS.
 */
export function TourCard({ ctx }: { ctx: RenderContext }) {
  const { step, progress, actions, isLast, canGoBack } = ctx

  return (
    <div className="guide">
      <div className="guide__head">
        <span className="guide__face" aria-hidden="true">
          RK
        </span>
        <span className="guide__who">
          <b>Rana Kessler</b>
          Studio lead
        </span>
        <span className="guide__step num">
          {progress.current}/{progress.total}
        </span>
      </div>

      <div className="guide__body">
        <h3>{step.title}</h3>
        {step.body && <p>{step.body}</p>}
        <div className="guide__rail" aria-hidden="true">
          {Array.from({ length: progress.total }, (_, i) => (
            <i key={String(i)} {...(i < progress.current ? { 'data-done': '' } : {})} />
          ))}
        </div>
      </div>

      <div className="guide__foot">
        <span className="guide__keys">
          <kbd>←</kbd> <kbd>→</kbd> to move
        </span>
        {canGoBack && (
          <button type="button" className="btn btn--quiet btn--small" onClick={actions.back}>
            Back
          </button>
        )}
        <button type="button" className="btn btn--primary btn--small" onClick={actions.next}>
          {isLast ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  )
}
