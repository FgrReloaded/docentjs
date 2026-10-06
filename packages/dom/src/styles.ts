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
/* Measures env(safe-area-inset-*) for the renderer; never seen. */
.safe-area {
  position: absolute;
  width: 0;
  height: 0;
  visibility: hidden;
  pointer-events: none;
  padding:
    env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px)
    env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px);
}

/* ------------------------------------------------------------------ overlay */

.overlay {
  --_scrim: color-mix(in oklch, var(--docent-overlay) calc(var(--docent-overlay-opacity) * 100%), transparent);
  position: absolute;
  inset: 0;
  background: var(--_scrim);
  pointer-events: auto;
  transition:
    clip-path var(--docent-duration) var(--docent-easing),
    opacity var(--docent-duration) ease-out;
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
    scale var(--docent-duration) var(--docent-easing),
    height var(--docent-duration) var(--docent-easing),
    /* A docked card's slide in and out: longer, and settling like a native sheet. */
    translate calc(var(--docent-duration) * 1.5) cubic-bezier(0.32, 0.72, 0, 1);
}
.popover[data-side="bottom"] { transform-origin: 50% 0; }
.popover[data-side="top"] { transform-origin: 50% 100%; }
.popover[data-side="right"] { transform-origin: 0 50%; }
.popover[data-side="left"] { transform-origin: 100% 50%; }
.popover[data-entering] { opacity: 0; scale: 0.97; transition: none; }
/*
 * Between steps the popover slides; its content cross-fades. Slots are
 * display: contents and draw nothing, so it is the content in them that moves.
 */
.popover[data-moving] > .arrow,
.popover[data-moving] > slot > *,
.popover[data-moving] > slot::slotted(*) { animation: docent-swap 160ms ease-out; }
@keyframes docent-swap { from { opacity: 0; } to { opacity: 1; } }
/* On a small screen the content comes in from the way the tour is going: Next from the end, Back from the start. */
.popover.small[data-moving="forward"] > slot > *,
.popover.small[data-moving="forward"] > slot::slotted(*) {
  animation: docent-from-end calc(var(--docent-duration) * 1.3) var(--docent-easing) both;
}
.popover.small[data-moving="back"] > slot > *,
.popover.small[data-moving="back"] > slot::slotted(*) {
  animation: docent-from-start calc(var(--docent-duration) * 1.3) var(--docent-easing) both;
}
@keyframes docent-from-end { from { opacity: 0; translate: 16px 0; } }
@keyframes docent-from-start { from { opacity: 0; translate: -16px 0; } }
/* While the card grows or shrinks to a new step, the text makes the room, without a scrollbar. */
.popover[data-resizing] .body { flex-grow: 1; overflow: hidden; }

/* ---------------------------------------------------------- enter and leave */

/* The scrim and ring fade in with the first step, and everything fades out at the end. */
:host([data-entering]) .overlay,
:host([data-leaving]) .overlay { opacity: 0; }
:host([data-entering]) .ring,
:host([data-leaving]) .ring { opacity: 0 !important; }
:host([data-leaving]) * { pointer-events: none !important; }
:host([data-leaving]) .popover { opacity: 0; scale: 0.97; }
/* A docked card slides in from the edge it sits on, and back out. */
.popover.sheet[data-entering],
:host([data-leaving]) .popover.sheet { opacity: 1; scale: 1; translate: 0 calc(100% + 24px); }
.popover.sheet[data-dock="top"][data-entering],
:host([data-leaving]) .popover.sheet[data-dock="top"] { translate: 0 calc(-100% - 24px); }
.popover.headless {
  width: auto;
  max-width: none;
  padding: 0;
  background: none;
  box-shadow: none;
  border-radius: 0;
}

/*
 * The arrow carries the same hairline on its two outward edges, and only its
 * outward half is painted, so a translucent (glass) card shows no seam.
 */
.arrow {
  position: absolute;
  width: 12px;
  height: 12px;
  background: var(--docent-bg);
  transform: rotate(45deg);
}
/* A docked card points the same way: [data-dock] names the target side it is on. */
.popover[data-side="bottom"] .arrow,
.popover[data-dock="bottom"] .arrow {
  top: -6px;
  border-top: 1px solid var(--_line);
  border-left: 1px solid var(--_line);
  border-top-left-radius: 2px;
  clip-path: polygon(0 0, 100% 0, 0 100%);
}
.popover[data-side="top"] .arrow,
.popover[data-dock="top"] .arrow {
  bottom: -6px;
  border-bottom: 1px solid var(--_line);
  border-right: 1px solid var(--_line);
  border-bottom-right-radius: 2px;
  clip-path: polygon(100% 0, 100% 100%, 0 100%);
}
.popover[data-side="right"] .arrow {
  left: -6px;
  border-bottom: 1px solid var(--_line);
  border-left: 1px solid var(--_line);
  border-bottom-left-radius: 2px;
  clip-path: polygon(0 0, 100% 100%, 0 100%);
}
.popover[data-side="left"] .arrow {
  right: -6px;
  border-top: 1px solid var(--_line);
  border-right: 1px solid var(--_line);
  border-top-right-radius: 2px;
  clip-path: polygon(0 0, 100% 0, 100% 100%);
}
.popover[data-side="center"] .arrow,
.popover[data-side="sheet"]:not([data-dock]) .arrow { display: none; }

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
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 12px;
  margin-top: 20px;
}
/*
 * Sized by its content, so when the buttons leave too little room the counter
 * takes a row of its own instead of being squeezed under them (phones, long
 * labels, three buttons).
 */
.progress {
  flex: 1 1 auto;
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
/* The meter and the bare count draw no marks; the phone card turns them into segments. */
.progress[data-progress="meter"] .marks,
.progress[data-progress="count"] .marks { display: none; }
.buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 6px;
  margin-inline-start: auto;
}
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

/* ------------------------------------------- small screens: the phone card */

/*
 * Laid out for thumbs: progress as one segment per step across the top, a
 * full-width main button, and Back and Skip as quiet text beneath it. The
 * footer's parts become rows of the card itself to allow that.
 */
.popover.stories .footer { display: contents; }
.popover.stories .progress { order: -2; flex: none; margin: -2px 0 12px; }
.popover.stories .progress .marks { display: flex; flex: 1; gap: 4px; }
.popover.stories .progress .marks i {
  position: relative;
  flex: 1;
  width: auto;
  max-width: none;
  height: 3px;
  margin: 0;
  border-radius: 999px;
  background: var(--_line);
  overflow: hidden;
}
.popover.stories .progress .marks i[data-done] { background: var(--docent-fg); }
/* The current step's segment fills as the step opens (not when going back to it). */
.popover.stories .progress .marks i[data-now] { background: var(--_line); }
.popover.stories .progress .marks i[data-now]::after {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--docent-fg);
  transform-origin: 0 50%;
  animation: docent-fill calc(var(--docent-duration) * 2.4) var(--docent-easing) both;
}
.popover.stories[data-moving="back"] .progress .marks i[data-now]::after { animation: none; }
@keyframes docent-fill { from { transform: scaleX(0); } }
/* The segments say it at a glance; the count stays for screen readers. */
.popover.stories .progress .meter { display: none; }
.popover.stories .progress .count,
.popover.compact .progress:not(:has(.marks i:nth-child(8))) .count {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.popover.stories .buttons {
  order: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px 0;
  width: 100%;
  margin: 16px 0 -6px;
}
.popover.stories [part~="button-next"] {
  grid-row: 1;
  grid-column: 1 / -1;
  min-height: 48px;
  border-radius: 12px;
  font-size: 15px;
}
.popover.stories [part~="button-back"],
.popover.stories [part~="button-skip"] { grid-row: 2; color: var(--docent-muted); padding: 0 8px; }
.popover.stories [part~="button-back"] { grid-column: 1; justify-self: start; margin-inline-start: -8px; }
.popover.stories [part~="button-skip"] { grid-column: 2; justify-self: end; margin-inline-end: -8px; }

/* A step with no target: centred on the screen, larger, its image as a hero. */
.popover.stories.hero .title { font-size: 21px; letter-spacing: -0.02em; }
.popover.stories.hero .media { order: -1; margin: 0 0 16px; }
.popover.stories.hero .media img,
.popover.stories.hero .media video { max-height: min(32vh, 220px); }

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

/* ------------------------------------------ small screens: the compact card */

/*
 * A coachmark: a small card, sized by its content, that springs out of its
 * caret beside the target. The counter becomes a pager, Back an icon, and Skip
 * steps aside for the close button, which does the same. Parts are styled
 * through :where() so a theme's own rules for them still win.
 */
.popover.compact {
  width: max-content;
  padding: 12px 14px;
  font-size: 13px;
  line-height: 1.45;
  transition:
    transform var(--docent-duration) var(--docent-easing),
    opacity var(--docent-duration) var(--docent-easing),
    scale calc(var(--docent-duration) * 1.8) cubic-bezier(0.34, 1.45, 0.64, 1),
    height var(--docent-duration) var(--docent-easing);
}
.popover.compact[data-side="bottom"] { transform-origin: var(--_at, 50%) 0; }
.popover.compact[data-side="top"] { transform-origin: var(--_at, 50%) 100%; }
.popover.compact[data-side="right"] { transform-origin: 0 var(--_at, 50%); }
.popover.compact[data-side="left"] { transform-origin: 100% var(--_at, 50%); }
.popover[data-over] .arrow { display: none; }
.popover.compact[data-entering],
:host([data-leaving]) .popover.compact { scale: 0.8; }
/* Each new step lands with a small spring as the card glides over. */
.popover.compact[data-moving] { animation: docent-land calc(var(--docent-duration) * 1.8) cubic-bezier(0.34, 1.45, 0.64, 1); }
@keyframes docent-land { from { scale: 0.94; } }

:where(.popover.compact) .header { gap: 8px; }
:where(.popover.compact) .title { font-size: 14.5px; line-height: 1.3; letter-spacing: -0.01em; }
:where(.popover.compact) .eyebrow { font-size: 10px; }
:where(.popover.compact) .body { margin-top: 3px; }
:where(.popover.compact) .media { margin-top: 10px; }
:where(.popover.compact) .media :is(img, video) { max-height: min(20vh, 140px); border-radius: 6px; }
:where(.popover.compact) .footer { flex-wrap: nowrap; gap: 10px; margin-top: 10px; }
:where(.popover.compact) .buttons { flex-wrap: nowrap; gap: 6px; }
:where(.popover.compact) .button {
  position: relative;
  height: 30px;
  min-height: 0;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 13px;
}
:where(.popover.compact) .close {
  position: relative;
  width: 24px;
  height: 24px;
  margin: -3px -6px 0 0;
  border-radius: 999px;
}
:where(.popover.compact) .close svg { width: 12px; height: 12px; }
.popover.compact:has(.close) [part~="button-skip"] { display: none; }
/* Back is a round chevron; its label stays for screen readers. */
:where(.popover.compact) [part~="button-back"] {
  width: 30px;
  padding: 0;
  font-size: 0;
  box-shadow: inset 0 0 0 1px var(--_line);
}
:where(.popover.compact) [part~="button-back"]::before {
  content: "";
  width: 7px;
  height: 7px;
  margin-left: 3px;
  border: solid currentColor;
  border-width: 0 0 1.5px 1.5px;
  rotate: 45deg;
}
/* Drawn small, tapped large: each hit area reaches about 44px. */
:where(.popover.compact) :is(.button, .close)::after {
  content: "";
  position: absolute;
  inset: -7px -3px;
}
:where(.popover.compact) .close::after { inset: -10px; }

/* The counter as a pager: one dot per step, the current one a pill. */
:where(.popover.compact) .meter { display: none; }
.popover.compact .progress .marks { display: flex; gap: 4px; }
.popover.compact .marks i {
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: var(--_line);
}
.popover.compact .marks i[data-done] { background: color-mix(in oklch, var(--docent-fg) 32%, transparent); }
.popover.compact .marks i[data-now] {
  width: 16px;
  background: var(--docent-fg);
  animation: docent-grow calc(var(--docent-duration) * 1.6) var(--docent-easing) both;
}
@keyframes docent-grow { from { width: 5px; } }
/* Past seven steps dots stop reading at a glance: the count shows instead. Below that it is hidden with the stories card's count. */
.popover.compact .progress:has(.marks i:nth-child(8)) .marks { display: none; }
:where(.popover.compact) .count { font-size: 11.5px; }

/* A step with no target: centred, with a larger title and its image on top. */
:where(.popover.compact.hero) .title { font-size: 17px; }
:where(.popover.compact.hero) .media { order: -1; margin: 0 0 12px; }

@media (prefers-reduced-motion: reduce) {
  .overlay, .popover, .ring { transition: none; }
  .ring::after { animation: none !important; }
  .popover[data-moving] > .arrow,
  .popover[data-moving] > slot > *,
  .popover[data-moving] > slot::slotted(*) { animation: none !important; }
  .popover.compact { transition: none; }
  .popover.compact[data-moving],
  .popover.compact .marks i { animation: none; }
}
`
