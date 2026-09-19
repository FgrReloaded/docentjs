export const STYLES = `
:host { all: initial; }
* { box-sizing: border-box; }
.root {
  --bg: #0f1117; --panel: #161a22; --line: #262c38; --fg: #e6e8ee; --muted: #8b93a7;
  --accent: #a78bfa; --ok: #34d399; --warn: #fbbf24; --bad: #f87171; --info: #60a5fa;
  font: 12px/1.45 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  color: var(--fg);
}
.toggle {
  position: fixed; left: 12px; bottom: 12px; z-index: 2147483647;
  display: flex; align-items: center; gap: 6px; padding: 7px 11px; border-radius: 999px;
  border: 1px solid var(--line); background: var(--bg); color: var(--fg); cursor: pointer;
  font: inherit; font-weight: 600; box-shadow: 0 6px 20px rgba(0,0,0,.35);
}
/* An author display value beats the [hidden] attribute, so restate it. */
.toggle[hidden] { display: none; }
.toggle .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--muted); }
.toggle .dot.on { background: var(--ok); box-shadow: 0 0 0 3px rgba(52,211,153,.25); }
.panel {
  position: fixed; top: 0; right: 0; bottom: 0; width: min(420px, 100vw); z-index: 2147483647;
  display: flex; flex-direction: column; background: var(--bg); border-left: 1px solid var(--line);
  box-shadow: -10px 0 30px rgba(0,0,0,.35);
}
.panel[hidden] { display: none; }
header { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid var(--line); }
header .title { font-weight: 700; flex: 1; }
.tabs { display: flex; border-bottom: 1px solid var(--line); }
.tabs button { flex: 1; padding: 8px; background: none; border: 0; color: var(--muted); cursor: pointer; font: inherit; border-bottom: 2px solid transparent; }
.tabs button[aria-selected="true"] { color: var(--fg); border-bottom-color: var(--accent); }
.body { flex: 1; overflow: auto; padding: 10px 12px; }
.now { display: flex; align-items: center; gap: 6px; padding: 8px 12px; background: var(--panel); border-bottom: 1px solid var(--line); }
.now .label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
button.btn {
  font: inherit; padding: 4px 9px; border-radius: 6px; border: 1px solid var(--line);
  background: var(--panel); color: var(--fg); cursor: pointer;
}
button.btn:hover { border-color: var(--accent); }
button.btn.primary { background: var(--accent); border-color: var(--accent); color: #111; font-weight: 600; }
button.icon { padding: 2px 7px; }
.card { border: 1px solid var(--line); border-radius: 8px; margin-bottom: 8px; background: var(--panel); }
.card > .head { display: flex; align-items: center; gap: 8px; padding: 8px 10px; cursor: pointer; }
.card > .head .name { font-weight: 600; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.summary { padding: 0 10px 8px; color: var(--muted); }
.detail { border-top: 1px solid var(--line); padding: 8px 10px; }
.detail h4 { margin: 8px 0 4px; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); }
.detail h4:first-child { margin-top: 0; }
.row { display: flex; align-items: flex-start; gap: 6px; padding: 2px 0; }
.row .grow { flex: 1; min-width: 0; overflow-wrap: anywhere; }
.badge { font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 999px; text-transform: uppercase; letter-spacing: .03em; }
.badge.running { background: rgba(52,211,153,.18); color: var(--ok); }
.badge.eligible { background: rgba(96,165,250,.18); color: var(--info); }
.badge.waiting { background: rgba(251,191,36,.16); color: var(--warn); }
.badge.blocked { background: rgba(248,113,113,.16); color: var(--bad); }
.badge.manual { background: rgba(139,147,167,.18); color: var(--muted); }
.ok { color: var(--ok); } .bad { color: var(--bad); } .muted { color: var(--muted); }
.actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
code, .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; }
label { display: block; color: var(--muted); margin: 10px 0 4px; }
input, textarea {
  width: 100%; font: 11px ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--fg);
  background: var(--panel); border: 1px solid var(--line); border-radius: 6px; padding: 6px 8px;
}
textarea { min-height: 90px; resize: vertical; }
.inline { display: flex; gap: 6px; }
.inline input { flex: 1; }
.event { display: grid; grid-template-columns: 56px 1fr; gap: 6px; padding: 3px 0; border-bottom: 1px dashed var(--line); }
.error { color: var(--bad); margin-top: 6px; }
.empty { color: var(--muted); padding: 20px 0; text-align: center; }
`

/** Outline drawn over a highlighted target, outside the devtools shadow root. */
export const HIGHLIGHT_STYLE =
  'position:fixed;pointer-events:none;z-index:2147483646;border:2px solid #a78bfa;border-radius:6px;background:rgba(167,139,250,.15);transition:all .12s ease'
