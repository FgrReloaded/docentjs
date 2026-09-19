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

export {
  type ConditionCheck,
  describeCondition,
  explainTour,
  type TourExplanation,
  type TourVerdict,
} from './explain'
export { type MountOptions, mount } from './panel'
export { checkTarget, type TargetHealth } from './targets'
