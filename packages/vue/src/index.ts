/**
 * @docentjs/vue
 *
 * Vue bindings for Docent.
 */

export * from './reexports'
export { type PopoverHost, TourPopover } from './TourPopover'
export { type DocentHandle, type UseDocentOptions, useDocent } from './useDocent'
export {
  DOCENT_KEY,
  type DocentDefaults,
  mergeOptions,
  provideDocentDefaults,
  type TourHandle,
  type UseTourOptions,
  useTour,
} from './useTour'
