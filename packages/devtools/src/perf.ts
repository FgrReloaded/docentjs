/**
 * Records how tours behave at runtime: how long each step took to appear,
 * how often the popover repositioned, and frames that ran long while it was up.
 */

import type { Docent, DocentEvent } from '@docentjs/core'

export interface StepTiming {
  /** Sequence number, stable across snapshots. */
  id: number
  tourId: string
  stepId: string
  /** From the previous step (or tour start) to this step being shown, in ms. */
  latency: number
  /** Popover position updates while this step was shown. */
  repositions: number
  /** Frames longer than 50 ms while this step was shown. */
  longFrames: number
  /** Worst frame while this step was shown, in ms. */
  worstFrame: number
}

export interface PerfSnapshot {
  steps: StepTiming[]
  missingTargets: number
}

export interface PerfRecorder {
  snapshot(): PerfSnapshot
  clear(): void
  subscribe(fn: () => void): () => void
  stop(): void
}

export function recordPerf(docent: Docent, doc: Document = document): PerfRecorder {
  const steps: StepTiming[] = []
  const listeners = new Set<() => void>()
  let missingTargets = 0
  let seq = 0
  let lastMark = performance.now()
  let current: StepTiming | undefined
  let frame = 0
  let lastFrame = 0
  let observer: MutationObserver | undefined
  const notify = () => {
    for (const l of listeners) l()
  }

  const watchPopover = () => {
    observer?.disconnect()
    const root = doc.querySelector('[data-docent-host]')?.shadowRoot
    if (!root) return
    observer = new MutationObserver((records) => {
      if (!current) return
      for (const r of records) {
        if (r.type === 'attributes' && (r.target as Element).classList?.contains('popover'))
          current.repositions++
      }
    })
    observer.observe(root, { subtree: true, attributes: true, attributeFilter: ['style'] })
  }

  const tickFrame = (t: number) => {
    if (current && lastFrame) {
      const gap = t - lastFrame
      if (gap > 50) current.longFrames++
      current.worstFrame = Math.max(current.worstFrame, Math.round(gap))
    }
    lastFrame = t
    frame = requestAnimationFrame(tickFrame)
  }

  const onEvent = (e: DocentEvent) => {
    const now = performance.now()
    if (e.type === 'tour:started' || e.type === 'step:completed') lastMark = now
    if (e.type === 'step:missing') missingTargets++
    if (e.type === 'step:shown' && e.stepId) {
      current = {
        id: ++seq,
        tourId: e.tourId,
        stepId: e.stepId,
        latency: Math.round(now - lastMark),
        repositions: 0,
        longFrames: 0,
        worstFrame: 0,
      }
      steps.push(current)
      if (steps.length > 200) steps.shift()
      lastFrame = 0
      // The popover for this step exists now; count moves from here on (not its first placement).
      queueMicrotask(watchPopover)
      if (!frame) frame = requestAnimationFrame(tickFrame)
    }
    if (e.type === 'tour:completed' || e.type === 'tour:skipped' || e.type === 'tour:aborted') {
      current = undefined
      cancelAnimationFrame(frame)
      frame = 0
      observer?.disconnect()
    }
    notify()
  }
  const off = docent.onEvent(onEvent)

  return {
    snapshot: () => ({ steps: steps.map((s) => ({ ...s })), missingTargets }),
    clear: () => {
      steps.length = 0
      missingTargets = 0
      notify()
    },
    subscribe: (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    stop: () => {
      off()
      cancelAnimationFrame(frame)
      observer?.disconnect()
      listeners.clear()
    },
  }
}
