/**
 * Arrow style names and spacing. Tiny and always loaded; the drawing code for
 * connector styles (connector.ts) is loaded only when a tour uses one.
 */

import type { ArrowStyle } from '@docentjs/core'

export const CONNECTOR_STYLES = [
  'line',
  'dashed',
  'dotted',
  'curve',
  'curve-dashed',
  'squiggle',
  'loop',
  'elbow',
  'sketch',
  'pin',
] as const satisfies readonly ArrowStyle[]

export type ConnectorStyle = (typeof CONNECTOR_STYLES)[number]

export function isConnector(style: ArrowStyle): style is ConnectorStyle {
  return (CONNECTOR_STYLES as readonly string[]).includes(style)
}

/** Space between target and popover for a style: connectors need room to be seen. */
export function arrowGap(style: ArrowStyle): number {
  if (!isConnector(style)) return 12
  return style === 'loop' || style === 'squiggle' ? 72 : 60
}
