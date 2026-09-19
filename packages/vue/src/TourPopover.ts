import type { RenderContext } from '@docentjs/core'
import { defineComponent, h, type PropType, type Ref, Teleport } from 'vue'

/** Anything exposing a custom-popover target: the handle from `useTour` or `useDocent`. */
export interface PopoverHost {
  popoverTarget: Readonly<Ref<HTMLElement | null>>
  popoverContext: Readonly<Ref<RenderContext | null>>
}

/**
 * Teleports its default slot into the container the library positions for
 * a custom popover. Use with `useTour(tour, { popover: true })` or
 * `useDocent({ popover: true })`.
 *
 * ```vue
 * <TourPopover :tour="tour" v-slot="{ ctx }">
 *   <MyCard :step="ctx.step" @next="ctx.actions.next()" />
 * </TourPopover>
 * ```
 */
export const TourPopover = defineComponent({
  name: 'TourPopover',
  props: {
    tour: { type: Object as PropType<PopoverHost>, required: true },
  },
  setup(props, { slots }) {
    return () => {
      const target = props.tour.popoverTarget.value
      const ctx: RenderContext | null = props.tour.popoverContext.value
      if (!target || !ctx) return null
      return h(Teleport, { to: target }, slots.default?.({ ctx }) ?? [])
    }
  },
})
