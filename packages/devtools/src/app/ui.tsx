/** @jsxImportSource preact */
/**
 * Small UI kit for the devtools panel. Plain components, styled by styles.ts.
 */

import type { ComponentChildren, JSX } from 'preact'

// ------------------------------------------------------------------- icons

const paths = {
  pick: 'M8 1.5v3M8 11.5v3M1.5 8h3M11.5 8h3M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  close: 'M4 4l8 8M12 4l-8 8',
  play: 'M5 3.5v9l7-4.5z',
  stop: 'M4.5 4.5h7v7h-7z',
  prev: 'M10 3.5L5.5 8 10 12.5',
  next: 'M6 3.5L10.5 8 6 12.5',
  restart: 'M3.5 8a4.5 4.5 0 1 0 1.4-3.3M3.5 2.5v3h3',
  copy: 'M5.5 5.5h7v7h-7zM3.5 10.5v-7h7',
  download: 'M8 2.5v8M4.5 7.5L8 11l3.5-3.5M3 13.5h10',
  reset: 'M3.5 8a4.5 4.5 0 1 0 1.4-3.3M3.5 2.5v3h3',
  trash: 'M3 4.5h10M6.5 4.5v-2h3v2M4.5 4.5l.5 9h6l.5-9',
  plus: 'M8 3v10M3 8h10',
  up: 'M4 10l4-4 4 4',
  down: 'M4 6l4 4 4-4',
  duplicate: 'M5.5 5.5h7v7h-7zM3.5 10.5v-7h7',
  dockRight: 'M2.5 3.5h11v9h-11zM9.5 3.5v9',
  dockLeft: 'M2.5 3.5h11v9h-11zM6.5 3.5v9',
  dockBottom: 'M2.5 3.5h11v9h-11zM2.5 9.5h11',
  search: 'M7 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM10 10l3 3',
  edit: 'M3 13l1-3.5L10.5 3l2.5 2.5L6.5 12zM9.5 4l2.5 2.5',
  help: 'M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM6.2 6.2a1.9 1.9 0 1 1 2.6 1.8c-.5.2-.8.6-.8 1.1v.4M8 11.2v.1',
} as const

export type IconName = keyof typeof paths

export function Icon({ name, size = 14 }: { name: IconName; size?: number }) {
  return (
    <svg
      class="icon"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  )
}

// ----------------------------------------------------------------- buttons

type ButtonProps = JSX.IntrinsicElements['button'] & {
  variant?: 'default' | 'primary' | 'ghost' | 'danger'
  icon?: IconName
  children?: ComponentChildren
}

export function Button({ variant = 'default', icon, children, class: cls, ...rest }: ButtonProps) {
  return (
    <button type="button" class={`btn ${variant} ${cls ?? ''}`} {...rest}>
      {icon && <Icon name={icon} />}
      {children}
    </button>
  )
}

export function IconButton({
  icon,
  label,
  ...rest
}: JSX.IntrinsicElements['button'] & { icon: IconName; label: string }) {
  return (
    <button type="button" class="btn icon-only ghost" title={label} aria-label={label} {...rest}>
      <Icon name={icon} />
    </button>
  )
}

// ------------------------------------------------------------------ fields

export function Field({
  label,
  hint,
  mark,
  children,
}: {
  label: string
  hint?: string
  /** `data-docent` name, for the devtools tour. */
  mark?: string
  children: ComponentChildren
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the control is passed in as children
    <label class="field" data-docent={mark}>
      <span class="field-label">{label}</span>
      {children}
      {hint && <span class="field-hint">{hint}</span>}
    </label>
  )
}

export function Text({
  value,
  onInput,
  placeholder,
  mono,
}: {
  value: string
  onInput: (v: string) => void
  placeholder?: string
  mono?: boolean
}) {
  return (
    <input
      class={mono ? 'mono' : ''}
      value={value}
      placeholder={placeholder}
      spellcheck={false}
      onInput={(e) => onInput((e.target as HTMLInputElement).value)}
    />
  )
}

export function Area({
  value,
  onInput,
  rows = 3,
}: {
  value: string
  onInput: (v: string) => void
  rows?: number
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      onInput={(e) => onInput((e.target as HTMLTextAreaElement).value)}
    />
  )
}

export function Select<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: ReadonlyArray<readonly [T, string]>
  onChange: (v: T) => void
}) {
  return (
    <select value={value} onChange={(e) => onChange((e.target as HTMLSelectElement).value as T)}>
      {options.map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  )
}

export function Check({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label class="check">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
      />
      <span>{label}</span>
    </label>
  )
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  unit = '',
  onInput,
}: {
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onInput: (v: number) => void
}) {
  return (
    <span class="slider">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onInput={(e) => onInput(Number((e.target as HTMLInputElement).value))}
      />
      <output class="mono">
        {value}
        {unit}
      </output>
    </span>
  )
}

export function Color({ value, onInput }: { value: string; onInput: (v: string) => void }) {
  return (
    <span class="color">
      <input
        type="color"
        value={value}
        onInput={(e) => onInput((e.target as HTMLInputElement).value)}
      />
      <input
        class="mono"
        value={value}
        spellcheck={false}
        onChange={(e) => onInput((e.target as HTMLInputElement).value)}
      />
    </span>
  )
}

// ----------------------------------------------------------------- display

export function Badge({ tone, children }: { tone: string; children: ComponentChildren }) {
  return <span class={`badge ${tone}`}>{children}</span>
}

export function Section({
  title,
  actions,
  mark,
  children,
}: {
  title: string
  actions?: ComponentChildren
  /** `data-docent` name, for the devtools tour. */
  mark?: string
  children: ComponentChildren
}) {
  return (
    <section class="section" data-docent={mark}>
      <header class="section-head">
        <h4>{title}</h4>
        {actions}
      </header>
      {children}
    </section>
  )
}

export function Empty({ children }: { children: ComponentChildren }) {
  return <div class="empty">{children}</div>
}

export function Mark({ ok }: { ok: boolean | null }) {
  if (ok === null) return <span class="mark muted">•</span>
  return <span class={`mark ${ok ? 'ok' : 'bad'}`}>{ok ? '✓' : '✗'}</span>
}

export function copyText(text: string): void {
  void navigator.clipboard?.writeText(text).catch(() => {})
}

export function download(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
