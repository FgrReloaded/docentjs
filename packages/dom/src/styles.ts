/** Styles injected into the shadow root. Theme through the custom properties. */
export const STYLES = `
:host {
  --docent-font: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --docent-bg: #ffffff;
  --docent-fg: #111827;
  --docent-muted: #6b7280;
  --docent-accent: #2563eb;
  --docent-accent-fg: #ffffff;
  --docent-radius: 12px;
  --docent-shadow: 0 10px 30px rgba(0, 0, 0, 0.18), 0 2px 6px rgba(0, 0, 0, 0.08);
  --docent-width: 320px;
  --docent-overlay: #000;
  --docent-overlay-opacity: 0.55;
  --docent-duration: 250ms;
  position: fixed;
  inset: 0;
  z-index: var(--docent-z, 2147483000);
  pointer-events: none;
  font: 14px/1.5 var(--docent-font);
  color: var(--docent-fg);
}
@media (prefers-color-scheme: dark) {
  :host {
    --docent-bg: #1f2937;
    --docent-fg: #f9fafb;
    --docent-muted: #9ca3af;
    --docent-accent: #60a5fa;
    --docent-accent-fg: #0b1220;
  }
}
* { box-sizing: border-box; }
.overlay {
  position: absolute;
  inset: 0;
  background: var(--docent-overlay);
  opacity: var(--docent-overlay-opacity);
  pointer-events: auto;
  transition: clip-path var(--docent-duration) ease;
}
.blocker {
  position: absolute;
  left: 0;
  top: 0;
  pointer-events: auto;
}
.popover {
  position: absolute;
  left: 0;
  top: 0;
  width: var(--docent-width);
  max-width: calc(100vw - 32px);
  background: var(--docent-bg);
  border-radius: var(--docent-radius);
  box-shadow: var(--docent-shadow);
  padding: 16px;
  pointer-events: auto;
  outline: none;
  transition: transform var(--docent-duration) ease, opacity var(--docent-duration) ease;
}
.popover[data-entering] { opacity: 0; }
.arrow {
  position: absolute;
  width: 12px;
  height: 12px;
  background: var(--docent-bg);
  transform: rotate(45deg);
}
.popover[data-side="top"] .arrow { bottom: -6px; }
.popover[data-side="bottom"] .arrow { top: -6px; }
.popover[data-side="left"] .arrow { right: -6px; }
.popover[data-side="right"] .arrow { left: -6px; }
.popover[data-side="center"] .arrow { display: none; }
.header { display: flex; align-items: flex-start; gap: 8px; }
.title { flex: 1; margin: 0; font-size: 16px; font-weight: 600; }
.close {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--docent-muted);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 2px 4px;
  margin: -4px -6px 0 0;
  border-radius: 6px;
}
.close:hover, .close:focus-visible { color: var(--docent-fg); background: rgba(127, 127, 127, 0.15); }
.body { margin-top: 6px; }
.body p { margin: 0 0 8px; }
.body p:last-child { margin-bottom: 0; }
.body code { font-family: ui-monospace, monospace; font-size: 0.9em; padding: 1px 4px; border-radius: 4px; background: rgba(127, 127, 127, 0.15); }
.body a { color: var(--docent-accent); }
.media { margin: 10px 0 0; }
.media img, .media video { display: block; max-width: 100%; border-radius: 8px; }
.footer { display: flex; align-items: center; gap: 8px; margin-top: 14px; }
.progress { flex: 1; color: var(--docent-muted); font-size: 12px; }
.button {
  appearance: none;
  border: 0;
  border-radius: 8px;
  padding: 7px 12px;
  font: inherit;
  font-weight: 500;
  cursor: pointer;
  background: rgba(127, 127, 127, 0.15);
  color: var(--docent-fg);
}
.button.primary { background: var(--docent-accent); color: var(--docent-accent-fg); }
.button:focus-visible, .close:focus-visible { outline: 2px solid var(--docent-accent); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  .overlay, .popover { transition: none; }
}
`
