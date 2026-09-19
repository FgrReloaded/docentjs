/**
 * @docentjs/devtools
 *
 * Development panel for Docent. Install as a dev dependency and load it only
 * in development so it never reaches production bundles:
 *
 * ```ts
 * if (import.meta.env.DEV) import('@docentjs/devtools').then((d) => d.mount(docent))
 * ```
 */

export { type MountOptions, mount } from './app/mount'
export { auditTours, type Issue, type Severity } from './audit'
export { contrastRatio, toHex } from './contrast'
export {
  type ConditionCheck,
  describeCondition,
  explainTour,
  type TourExplanation,
  type TourVerdict,
} from './explain'
export { type PerfRecorder, type PerfSnapshot, recordPerf, type StepTiming } from './perf'
export { suggestName, type TargetCandidate, targetCandidates } from './selectors'
export { checkTarget, type TargetHealth } from './targets'
