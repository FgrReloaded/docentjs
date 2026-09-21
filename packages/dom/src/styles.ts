/**
 * Styles injected into the shadow root. Theme through the custom properties.
 *
 * Design: quiet precision (see .impeccable.md). The popover inherits the host
 * site's font; hierarchy comes from size, weight, tracking and color. Colors
 * are ink tinted toward the Docent hue (OKLCH 285). Light is the default;
 * dark is opt-in through tokens or the `dark` preset.
 */
export const STYLES = `
:host {
  /* Public tokens (see Theme). --docent-font is unset so the host font is inherited. */
  --docent-bg: oklch(99.4% 0.003 285);
  --docent-fg: oklch(23% 0.018 285);
  --docent-muted: oklch(52% 0.014 285);
  --docent-accent: oklch(26% 0.02 285);
  --docent-accent-fg: oklch(98.5% 0.004 285);
  --docent-radius: 14px;
  --docent-shadow:
    0 1px 2px oklch(23% 0.02 285 / 0.06),
    0 8px 24px -6px oklch(23% 0.02 285 / 0.16),
    0 28px 56px -16px oklch(23% 0.02 285 / 0.24);
  --docent-width: 344px;
  --docent-overlay: oklch(20% 0.02 285);
  --docent-overlay-opacity: 0.52;
  --docent-duration: 220ms;
  /* Fast start, gentle stop: movement begins the moment you click. */
  --docent-easing: cubic-bezier(0.2, 0.8, 0.2, 1);

  /* Derived, internal: follow whatever the tokens are set to. */
  --_line: color-mix(in oklch, var(--docent-fg) 11%, transparent);
  --_soft: color-mix(in oklch, var(--docent-fg) 6%, transparent);
  --_body: color-mix(in oklch, var(--docent-fg) 80%, var(--docent-bg));

  position: fixed;
  inset: 0;
  z-index: var(--docent-z, 2147483000);
  pointer-events: none;
  color: var(--docent-fg);
  /* Invalid (unset) when the token is absent, which inherits the host font. */
  font-family: var(--docent-font);
  font-size: 14px;
  font-weight: 400;
  font-style: normal;
  line-height: 1.55;
  letter-spacing: normal;
  text-transform: none;
  text-align: start;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
* { box-sizing: border-box; }

/* ------------------------------------------------------------------ overlay */

.overlay {
  --_scrim: color-mix(in oklch, var(--docent-overlay) calc(var(--docent-overlay-opacity) * 100%), transparent);
  position: absolute;
  inset: 0;
  background: var(--_scrim);
  pointer-events: auto;
  transition: clip-path var(--docent-duration) var(--docent-easing);
}
/* Overlay styles. The scrim is a translucent color (not element opacity), so blur stays crisp. */
:host([data-overlay="blur"]) .overlay {
  -webkit-backdrop-filter: blur(var(--docent-blur, 4px));
  backdrop-filter: blur(var(--docent-blur, 4px));
}
:host([data-overlay="vignette"]) .overlay {
  background: radial-gradient(
    circle at var(--docent-hole-x, 50%) var(--docent-hole-y, 50%),
    transparent 0,
    color-mix(in oklch, var(--docent-overlay) calc(var(--docent-overlay-opacity) * 30%), transparent) 22%,
    var(--_scrim) 78%
  );
}
:host([data-overlay="none"]) .overlay { background: transparent; pointer-events: none; }
.blocker {
  position: absolute;
  left: 0;
  top: 0;
  pointer-events: auto;
}
/* A hairline of light around the cutout keeps the target crisp against the scrim. */
.ring {
  position: absolute;
  left: 0;
  top: 0;
  pointer-events: none;
  /* Light by default: it sits on the scrim, not on the popover, in every theme. */
  color: var(--docent-ring, oklch(98% 0.004 285));
  box-shadow:
    0 0 0 1px color-mix(in oklch, currentColor 58%, transparent),
    0 0 0 6px color-mix(in oklch, currentColor 8%, transparent);
  transition:
    transform var(--docent-duration) var(--docent-easing),
    width var(--docent-duration) var(--docent-easing),
    height var(--docent-duration) var(--docent-easing),
    border-radius var(--docent-duration) var(--docent-easing),
    opacity var(--docent-duration) var(--docent-easing);
}

/* Ring styles. */
:host([data-overlay="none"]) .ring { color: var(--docent-ring, var(--docent-accent)); }
:host([data-ring="none"]) .ring { box-shadow: none; }
:host([data-ring="glow"]) .ring {
  box-shadow:
    0 0 0 1.5px color-mix(in oklch, currentColor 85%, transparent),
    0 0 20px 4px color-mix(in oklch, currentColor 42%, transparent);
}
:host([data-ring="solid"]) .ring { box-shadow: 0 0 0 2px currentColor; }
:host([data-ring="dashed"]) .ring {
  box-shadow: none;
  outline: 1.5px dashed color-mix(in oklch, currentColor 85%, transparent);
  outline-offset: 3px;
}
:host([data-ring="pulse"]) .ring::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  animation: docent-pulse 1.8s var(--docent-easing) infinite;
}
@keyframes docent-pulse {
  from { box-shadow: 0 0 0 0 color-mix(in oklch, currentColor 60%, transparent); }
  to { box-shadow: 0 0 0 14px transparent; }
}

:host(:not([data-arrow="caret"])) .arrow { display: none; }
/* A connector with no room to be drawn falls back to the caret. */
:host([data-caret]) .arrow { display: block; }

/* Scroll-driven updates follow the target instantly. */
:host([data-tracking]) .overlay,
:host([data-tracking]) .ring,
:host([data-tracking]) .popover { transition: none; }

/* ------------------------------------------------------------------ popover */

.popover {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  flex-direction: column;
  width: var(--docent-width);
  max-width: calc(100vw - 32px);
  max-height: var(--docent-max-h, none);
  padding: var(--docent-padding, 20px 20px 16px);
  background: var(--docent-bg);
  border-radius: var(--docent-radius);
  box-shadow: 0 0 0 1px var(--_line), var(--docent-shadow);
  pointer-events: auto;
  outline: none;
  transition:
    transform var(--docent-duration) var(--docent-easing),
    opacity var(--docent-duration) var(--docent-easing),
    scale var(--docent-duration) var(--docent-easing);
}
.popover[data-side="bottom"] { transform-origin: 50% 0; }
.popover[data-side="top"] { transform-origin: 50% 100%; }
.popover[data-side="right"] { transform-origin: 0 50%; }
.popover[data-side="left"] { transform-origin: 100% 50%; }
.popover[data-entering] { opacity: 0; scale: 0.97; transition: none; }
/* Between steps the popover slides; only its content cross-fades, briefly. */
.popover[data-moving] > * { animation: docent-swap 160ms ease-out; }
@keyframes docent-swap { from { opacity: 0; } to { opacity: 1; } }
.popover.headless {
  width: auto;
  max-width: none;
  padding: 0;
  background: none;
  box-shadow: none;
  border-radius: 0;
}

/* The arrow carries the same hairline on its two outward edges. */
.arrow {
  position: absolute;
  width: 12px;
  height: 12px;
  background: var(--docent-bg);
  transform: rotate(45deg);
}
.popover[data-side="bottom"] .arrow {
  top: -6px;
  border-top: 1px solid var(--_line);
  border-left: 1px solid var(--_line);
  border-top-left-radius: 2px;
}
.popover[data-side="top"] .arrow {
  bottom: -6px;
  border-bottom: 1px solid var(--_line);
  border-right: 1px solid var(--_line);
  border-bottom-right-radius: 2px;
}
.popover[data-side="right"] .arrow {
  left: -6px;
  border-bottom: 1px solid var(--_line);
  border-left: 1px solid var(--_line);
  border-bottom-left-radius: 2px;
}
.popover[data-side="left"] .arrow {
  right: -6px;
  border-top: 1px solid var(--_line);
  border-right: 1px solid var(--_line);
  border-top-right-radius: 2px;
}
.popover[data-side="center"] .arrow,
.popover[data-side="sheet"] .arrow { display: none; }

/* ------------------------------------------------------------------ content */

.header { flex: none; display: flex; align-items: flex-start; gap: 12px; }
.title {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.012em;
  color: var(--docent-fg);
  text-wrap: balance;
}
/* An eyebrow stacks a small line above the heading; without one the h2 stands alone. */
.titles { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.titles .title { flex: none; }
.eyebrow {
  margin: 0;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: 0.085em;
  text-transform: uppercase;
  color: var(--docent-muted);
}
.close {
  flex: none;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  margin: -3px -8px -3px 0;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--docent-muted);
  cursor: pointer;
  transition: background-color 120ms ease-out, color 120ms ease-out;
}
.close svg { width: 14px; height: 14px; }
.close:hover { background: var(--_soft); color: var(--docent-fg); }

/* While more text remains below, the last line fades instead of being cut. */
.popover.scrolls .body {
  mask-image: linear-gradient(to bottom, #000 calc(100% - 24px), transparent);
}

/* Grows to fill the card, and scrolls when the screen is too short for it. */
.body {
  flex: 0 1 auto;
  min-height: 0;
  margin-top: 6px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: var(--_line) transparent;
  color: var(--_body);
  text-wrap: pretty;
}
.body p { margin: 0; }
.body p + p { margin-top: 8px; }
.body strong { font-weight: 600; color: var(--docent-fg); }
.body a {
  color: var(--docent-fg);
  text-decoration: underline;
  text-decoration-color: color-mix(in oklch, var(--docent-fg) 32%, transparent);
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  transition: text-decoration-color 120ms ease-out;
}
.body a:hover { text-decoration-color: currentColor; }
.body code {
  font-family: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.88em;
  padding: 1px 5px;
  border-radius: 5px;
  background: var(--_soft);
  color: var(--docent-fg);
}

.media { flex: none; margin-top: 14px; min-height: 0; }
.media img, .media video {
  display: block;
  width: 100%;
  max-height: min(40vh, 280px);
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 0 0 1px var(--_line);
}

/* ------------------------------------------------------------------- footer */

.footer {
  flex: none;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
}
.progress {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: var(--docent-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
  white-space: nowrap;
}
.meter {
  flex: none;
  width: 28px;
  height: 3px;
  border-radius: 999px;
  background:
    linear-gradient(var(--docent-fg), var(--docent-fg)) 0 0 / calc(var(--docent-step) / var(--docent-steps) * 100%) 100% no-repeat,
    var(--_line);
}
/* One mark per step, filled up to the current one. Ticks are a ruled line,
   dots are round and stand on their own. */
.marks { flex: none; display: flex; align-items: center; gap: 3px; }
.marks i { width: 8px; height: 2px; border-radius: 1px; background: var(--_line); }
.marks i[data-done] { background: var(--docent-fg); }
.progress[data-progress="dots"] .marks { gap: 5px; }
.progress[data-progress="dots"] .marks i { width: 5px; height: 5px; border-radius: 50%; }
.buttons { display: flex; align-items: center; gap: 6px; }
.button {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 12px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--docent-fg);
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.003em;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color 120ms ease-out,
    color 120ms ease-out,
    scale 80ms ease-out;
}
.button:hover { background: var(--_soft); }
.button:active { scale: 0.97; }
[part~="button-skip"] { color: var(--docent-muted); padding: 0 8px; }
[part~="button-skip"]:hover { color: var(--docent-fg); background: transparent; }
.button.primary {
  padding: 0 14px;
  background: var(--docent-accent);
  color: var(--docent-accent-fg);
  font-weight: 600;
  box-shadow: inset 0 1px 0 color-mix(in oklch, var(--docent-accent-fg) 14%, transparent);
}
.button.primary .icon { width: 12px; height: 12px; margin: 0 -2px 0 6px; transition: translate 160ms var(--docent-easing); }
.button.primary:hover .icon { translate: 2px 0; }
.button.primary:hover {
  background: color-mix(in oklch, var(--docent-accent) 86%, var(--docent-accent-fg));
}
.button:focus-visible,
.close:focus-visible {
  outline: 2px solid var(--docent-accent);
  outline-offset: 2px;
}

/* --------------------------------------------------- small screens: docked */

/*
 * Too little room to sit beside the target: the popover docks near the bottom
 * as a card with air around it, rather than a drawer stuck to the edge.
 */
.popover.sheet {
  max-width: none;
  border-radius: var(--docent-radius);
  box-shadow:
    0 0 0 1px var(--_line),
    0 2px 6px -2px oklch(23% 0.02 285 / 0.12),
    0 -14px 44px -16px oklch(23% 0.02 285 / 0.34);
}

/* Tighter type and spacing where the screen is short or narrow. */
@media (max-height: 600px), (max-width: 420px) {
  .popover { padding: 16px 16px 14px; }
  .title { font-size: 16.5px; }
  .footer { margin-top: 14px; }
  .media { margin-top: 10px; }
  .media img, .media video { max-height: min(28vh, 200px); }
}
@media (pointer: coarse) {
  :host { font-size: 15px; }
  .button { min-height: 44px; padding: 0 16px; font-size: 14px; }
  .close { width: 40px; height: 40px; margin: -9px -12px -9px 0; }
}

@media (prefers-reduced-motion: reduce) {
  .overlay, .popover, .ring { transition: none; }
  .ring::after { animation: none !important; }
  .popover[data-moving] > * { animation: none; }
}
`
