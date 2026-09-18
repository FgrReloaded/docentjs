import type { Tour } from '../schema/tour'
import type { DocentEvent, DocentEventType, EventSink, Identity } from '../seams'
import { tourVersion } from './progress'

export interface EventInput {
  tour: Tour
  identity: Identity
  stepIndex?: number
  now?: () => number
}

export function createEvent(type: DocentEventType, input: EventInput): DocentEvent {
  const event: DocentEvent = {
    type,
    tourId: input.tour.id,
    tourVersion: tourVersion(input.tour),
    timestamp: (input.now ?? Date.now)(),
    identity: input.identity,
  }
  if (input.stepIndex !== undefined && input.stepIndex >= 0) {
    const step = input.tour.steps[input.stepIndex]
    event.stepIndex = input.stepIndex
    if (step) event.stepId = step.id
  }
  return event
}

/** Sink that drops everything. Default when none is configured. */
export const NOOP_SINK: EventSink = { emit() {} }

/** Fan out to several sinks. */
export function combineSinks(...sinks: EventSink[]): EventSink {
  return {
    emit: (e) => {
      for (const s of sinks) s.emit(e)
    },
  }
}
