---
'@docentjs/devtools': patch
---

Devtools edits survive reloads. Unsaved edits are kept in this browser's localStorage and restored on the next load, with a notice in the Edit tab. If the tour's code changed since the edits were made, the panel warns you so you can review or discard them. Once the code matches the edits, for example after pasting the copied JSON in, the saved copy is dropped. Discard edits removes it too.
