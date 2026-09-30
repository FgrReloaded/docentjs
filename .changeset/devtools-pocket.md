---
'@docentjs/devtools': minor
---

Pocket: the phone button in the panel's header shows your page at phone size, in a frame beside the panel, with the selected tour running in it. Pick 360, 390, 430 or 480 px, or turn it sideways; the page inside lays out at that width, so its own phone styles apply. The phone is always drawn at its true size, never scaled (which looked soft): in a short window it is shorter instead, and a phone wider than the room scrolls. Edits in the panel show up in the phone as you make them, choosing a step takes the phone there, Preview step starts in it, and the panel's top bar follows the phone. The page inside runs its devtools as a quiet guest, with no second panel. A tour already running on the page is left alone (stopping it would record it as skipped). The phone's rounded screen corners are painted over the frame rather than clipping it, since rounded clipping makes Chrome blur a `blur` overlay's spotlight inside the frame.
