/**
 * Devtools panel styles: a dark ink workspace in the same quiet-precision
 * language as the popover, tuned for dense information at 12px.
 */
export const STYLES = `
:host { all: initial; }
* { box-sizing: border-box; }
.root {
  --bg: oklch(17.5% 0.012 285);
  --panel: oklch(21% 0.013 285);
  --raised: oklch(24.5% 0.014 285);
  --line: oklch(30% 0.014 285);
  --line-soft: oklch(26% 0.013 285);
  --fg: oklch(94% 0.006 285);
  --muted: oklch(68% 0.012 285);
  --faint: oklch(52% 0.012 285);
  --accent: oklch(74% 0.13 290);
  --accent-soft: oklch(74% 0.13 290 / 0.14);
  --ok: oklch(76% 0.14 160);
  --warn: oklch(82% 0.13 85);
  --bad: oklch(70% 0.17 25);
  --info: oklch(74% 0.1 245);
  font: 12px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif;
  color: var(--fg);
  -webkit-font-smoothing: antialiased;
}
.mono, code, output { font-family: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; }
.muted { color: var(--muted); }
.small { font-size: 11px; }
.grow { flex: 1; min-width: 0; }
.right { text-align: right; }
.ok { color: var(--ok); } .warn { color: var(--warn); } .bad { color: var(--bad); }

/* ------------------------------------------------------------ toggle + shell */

.toggle {
  position: fixed; left: 12px; bottom: 12px; z-index: 2147483647;
  display: inline-flex; align-items: center; gap: 7px; height: 30px; padding: 0 12px 0 10px;
  border: 1px solid var(--line); border-radius: 999px; background: var(--bg); color: var(--fg);
  font: inherit; font-weight: 600; cursor: pointer;
  box-shadow: 0 8px 24px -8px oklch(10% 0.02 285 / .6);
  transition: border-color 120ms ease-out;
}
.toggle:hover { border-color: var(--accent); }
.dot { width: 7px; height: 7px; border-radius: 50%; background: var(--faint); flex: none; }
.dot.on, .live { background: var(--ok); box-shadow: 0 0 0 3px oklch(76% 0.14 160 / .2); }
.card .dot { background: var(--accent); }

.panel {
  position: fixed; z-index: 2147483647; display: flex; flex-direction: column;
  background: var(--bg); color: var(--fg);
  box-shadow: 0 0 0 1px var(--line), 0 20px 60px -20px oklch(8% 0.02 285 / .7);
}
.panel.dock-right { top: 0; right: 0; bottom: 0; max-width: 100vw; }
.panel.dock-left { top: 0; left: 0; bottom: 0; max-width: 100vw; }
.panel.dock-bottom { left: 0; right: 0; bottom: 0; max-height: 100vh; }
.panel.picking { opacity: .35; pointer-events: none; }
.resizer { position: absolute; z-index: 1; background: transparent; touch-action: none; }
.dock-right .resizer { left: -3px; top: 0; bottom: 0; width: 6px; cursor: ew-resize; }
.dock-left .resizer { right: -3px; top: 0; bottom: 0; width: 6px; cursor: ew-resize; }
.dock-bottom .resizer { top: -3px; left: 0; right: 0; height: 6px; cursor: ns-resize; }
.resizer:hover { background: var(--accent-soft); }

.bar { display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 8px 0 14px; border-bottom: 1px solid var(--line-soft); }
.logo {
  width: 14px; height: 14px; border-radius: 50%;
  background: radial-gradient(circle at 50% 50%, var(--accent) 0 3px, transparent 3.5px), transparent;
  box-shadow: inset 0 0 0 2px var(--accent);
}
.title { font-weight: 650; letter-spacing: -0.01em; }

.now { display: flex; align-items: center; gap: 4px; min-height: 36px; padding: 4px 8px 4px 14px; background: var(--panel); border-bottom: 1px solid var(--line-soft); }
.now .label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.now .live { width: 7px; height: 7px; border-radius: 50%; margin-right: 6px; flex: none; }

.tabs { display: flex; gap: 2px; padding: 0 8px; border-bottom: 1px solid var(--line-soft); overflow-x: auto; scrollbar-width: none; }
.tabs button {
  display: inline-flex; align-items: center; gap: 6px; padding: 9px 8px 8px; border: 0; background: none;
  color: var(--muted); font: inherit; font-weight: 500; cursor: pointer; white-space: nowrap;
  border-bottom: 2px solid transparent; margin-bottom: -1px;
}
.tabs button:hover { color: var(--fg); }
.tabs button[aria-selected="true"] { color: var(--fg); border-bottom-color: var(--accent); }
.pill { min-width: 16px; height: 16px; padding: 0 5px; border-radius: 999px; font-size: 10px; font-weight: 700; line-height: 16px; text-align: center; color: var(--bg); }
.pill.bad { background: var(--bad); } .pill.warn { background: var(--warn); }

.body { flex: 1; overflow: auto; padding: 12px; scrollbar-width: thin; scrollbar-color: var(--line) transparent; }
.stack { display: flex; flex-direction: column; gap: 10px; }
.inline { display: flex; align-items: center; gap: 6px; }
.inline.wrap { flex-wrap: wrap; }
.inline.tight { gap: 0; }
.toolbar { display: flex; align-items: center; gap: 6px; }
.grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
.empty { padding: 28px 12px; text-align: center; color: var(--muted); }
.error { color: var(--bad); min-height: 0; }
.error:empty { display: none; }

/* -------------------------------------------------------------- controls */

.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 28px; padding: 0 10px;
  border: 1px solid var(--line); border-radius: 7px; background: var(--raised); color: var(--fg);
  font: inherit; font-weight: 500; cursor: pointer; white-space: nowrap;
  transition: border-color 120ms ease-out, background-color 120ms ease-out, color 120ms ease-out;
}
.btn:hover { border-color: var(--faint); }
.btn:disabled { opacity: .4; cursor: default; }
.btn.primary { background: var(--accent); border-color: var(--accent); color: oklch(18% 0.03 290); font-weight: 600; }
.btn.primary:hover { background: color-mix(in oklch, var(--accent) 88%, white); }
.btn.ghost { background: transparent; border-color: transparent; color: var(--muted); }
.btn.ghost:hover { background: var(--raised); color: var(--fg); }
.btn.icon-only { width: 28px; padding: 0; }
.btn.chip { height: 24px; padding: 0 10px; border-radius: 999px; font-size: 11px; }
.btn .icon { flex: none; }
.btn:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible, .tabs button:focus-visible, .step-item:focus-visible, .issue:focus-visible, .candidate:focus-visible {
  outline: 2px solid var(--accent); outline-offset: 1px;
}

input, select, textarea {
  width: 100%; min-width: 0; height: 28px; padding: 0 8px; border: 1px solid var(--line); border-radius: 7px;
  background: var(--panel); color: var(--fg); font: inherit; outline: none;
  transition: border-color 120ms ease-out;
}
textarea { height: auto; padding: 6px 8px; resize: vertical; line-height: 1.45; }
input:hover, select:hover, textarea:hover { border-color: var(--faint); }
input:focus, select:focus, textarea:focus { border-color: var(--accent); }
input.mono, textarea.mono { font-size: 11px; }
select { appearance: none; padding-right: 22px; background-image: linear-gradient(45deg, transparent 50%, var(--muted) 50%), linear-gradient(135deg, var(--muted) 50%, transparent 50%); background-position: calc(100% - 12px) 12px, calc(100% - 8px) 12px; background-size: 4px 4px; background-repeat: no-repeat; }
.toolbar select { width: auto; max-width: 60%; }

.field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.field-label { color: var(--muted); font-size: 11px; font-weight: 500; }
.field-hint { color: var(--faint); font-size: 11px; }
.check { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; color: var(--fg); }
.check input { width: 14px; height: 14px; accent-color: var(--accent); }
.checks { display: flex; flex-wrap: wrap; gap: 6px 14px; }
.slider { display: flex; align-items: center; gap: 8px; }
.slider input { padding: 0; border: 0; background: none; height: 20px; accent-color: var(--accent); }
.slider output { min-width: 44px; text-align: right; color: var(--muted); }
.color { display: flex; gap: 6px; }
.color input[type="color"] { width: 32px; flex: none; padding: 2px; cursor: pointer; }
.search { display: flex; align-items: center; gap: 6px; padding: 0 8px; border: 1px solid var(--line); border-radius: 7px; background: var(--panel); color: var(--muted); }
.search input { border: 0; background: none; padding: 0; }

/* ------------------------------------------------------------- sections */

.section { display: flex; flex-direction: column; gap: 10px; padding: 12px; border: 1px solid var(--line-soft); border-radius: 10px; background: var(--panel); }
.section-head { display: flex; align-items: center; gap: 8px; min-height: 22px; }
.section-head h4, .detail h4 { margin: 0; flex: 1; font-size: 10.5px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); }
.actions { display: flex; flex-wrap: wrap; gap: 6px; }

.badge { flex: none; font-size: 10px; font-weight: 650; letter-spacing: .03em; text-transform: uppercase; padding: 2px 7px; border-radius: 999px; }
.badge.running { background: oklch(76% 0.14 160 / .16); color: var(--ok); }
.badge.eligible { background: oklch(74% 0.1 245 / .16); color: var(--info); }
.badge.waiting { background: oklch(82% 0.13 85 / .14); color: var(--warn); }
.badge.blocked { background: oklch(70% 0.17 25 / .16); color: var(--bad); }
.badge.manual { background: var(--raised); color: var(--muted); }
.mark { width: 12px; flex: none; text-align: center; }
.mark.ok { color: var(--ok); } .mark.bad { color: var(--bad); } .mark.muted { color: var(--faint); }

/* ---------------------------------------------------------------- tours */

.card { border: 1px solid var(--line-soft); border-radius: 10px; background: var(--panel); overflow: hidden; }
.card.open { border-color: var(--line); }
.card > .head { display: flex; align-items: center; gap: 8px; width: 100%; padding: 9px 10px; border: 0; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; }
.card > .head:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.card > .head.static { cursor: default; }
.card > .head:hover:not(.static) { background: var(--raised); }
.chev { color: var(--faint); width: 10px; }
.name { flex: 1; min-width: 0; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.summary { padding: 0 10px 9px 28px; color: var(--muted); }
.detail { display: flex; flex-direction: column; gap: 4px; padding: 10px 10px 12px; border-top: 1px solid var(--line-soft); }
.detail h4 { margin-top: 8px; }
.detail h4:first-child { margin-top: 0; }
.row { display: flex; align-items: flex-start; gap: 8px; padding: 3px 0; overflow-wrap: anywhere; }
.row.muted { padding-left: 20px; }
.step-row { align-items: center; padding: 4px 4px; margin: 0 -4px; border-radius: 6px; }
.step-row:hover { background: var(--raised); }
.index { color: var(--faint); width: 18px; flex: none; }
.detail .actions { margin-top: 8px; }

/* ----------------------------------------------------------------- edit */

.step-list { display: flex; flex-direction: column; gap: 2px; max-height: 200px; overflow: auto; }
.step-item {
  display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 8px; border: 1px solid transparent; border-radius: 7px;
  background: none; color: var(--fg); font: inherit; text-align: left; cursor: pointer;
}
.step-item:hover { background: var(--raised); }
.step-item.on { background: var(--accent-soft); border-color: oklch(74% 0.13 290 / .35); }
.candidates { display: flex; flex-direction: column; gap: 4px; padding: 8px; border: 1px dashed var(--line); border-radius: 8px; }
.candidate { display: flex; align-items: center; gap: 6px; padding: 6px 8px; border: 1px solid var(--line-soft); border-radius: 6px; background: var(--bg); color: var(--fg); font: inherit; text-align: left; cursor: pointer; }
.candidate:hover { border-color: var(--accent); }
.hint-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; color: var(--muted); }
code { padding: 1px 5px; border-radius: 4px; background: var(--raised); color: var(--fg); }

/* ---------------------------------------------------------------- audit */

.audit-summary { display: flex; align-items: baseline; gap: 12px; font-weight: 600; }
.issue {
  display: flex; align-items: flex-start; gap: 10px; width: 100%; padding: 8px 10px; border: 0; border-top: 1px solid var(--line-soft);
  background: none; color: var(--fg); font: inherit; text-align: left; cursor: pointer;
}
.issue:hover { background: var(--raised); }
.sev { flex: none; width: 58px; font-size: 10px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; padding-top: 1px; }
.sev.error { color: var(--bad); } .sev.warning { color: var(--warn); } .sev.info { color: var(--info); }
.hint { display: block; margin-top: 2px; color: var(--muted); }

/* --------------------------------------------------------- events + perf */

.events { display: flex; flex-direction: column; }
.event { display: grid; grid-template-columns: 56px 1fr; gap: 8px; padding: 5px 2px; border-bottom: 1px solid var(--line-soft); }
.event.step-missing strong, .event.tour-aborted strong { color: var(--bad); }
.event.tour-completed strong { color: var(--ok); }
.metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px; }
.metric { display: flex; flex-direction: column; gap: 2px; padding: 10px; border: 1px solid var(--line-soft); border-radius: 10px; background: var(--panel); }
.metric .label { color: var(--muted); font-size: 11px; }
.metric .value { font-size: 18px; font-weight: 650; letter-spacing: -0.01em; font-variant-numeric: tabular-nums; }
table.perf { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
.perf th { text-align: left; font-weight: 500; color: var(--muted); font-size: 11px; padding: 6px 4px; border-bottom: 1px solid var(--line); }
.perf td { padding: 6px 4px; border-bottom: 1px solid var(--line-soft); }
.perf .num { text-align: right; white-space: nowrap; }

@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
`

/** Outline drawn over a target on the page (outside the devtools shadow root). */
export const OUTLINE_STYLE =
  'position:fixed;pointer-events:none;z-index:2147483646;border:1.5px solid oklch(74% 0.13 290);border-radius:6px;background:oklch(74% 0.13 290 / .12);box-shadow:0 0 0 4px oklch(74% 0.13 290 / .12);transition:all .12s ease-out'
