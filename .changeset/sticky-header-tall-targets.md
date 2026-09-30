---
'@docentjs/dom': patch
---

On a small screen, a target taller than the room above a docked card no longer ends up under the app's sticky header. Its top now comes to just below the header, including a header that only pins once the page scrolls, and the spotlight is cropped to below it. Before, part of the target sat under the header, and a frosted (backdrop-blurred) header showed it blurred inside the spotlight.
