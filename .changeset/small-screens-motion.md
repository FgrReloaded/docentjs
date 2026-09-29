---
'@docentjs/dom': minor
'@docentjs/devtools': patch
---

Motion. The scrim fades in with the first step and the whole tour fades out when it ends, instead of vanishing; a docked card on a phone slides up from the edge it sits on and back out. Between steps the card grows or shrinks to the new step's height instead of jumping, and on small screens the content slides in the direction of travel (Next from the end, Back from the start). The content cross-fade between steps now actually shows: it was running on the slots, which draw nothing. Everything respects `prefers-reduced-motion`. A tour that is leaving keeps its host for the exit, marked `data-leaving`; lookups of the live tour (beacons, devtools) skip it.
