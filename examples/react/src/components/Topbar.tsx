export type Period = 'month' | 'quarter' | 'year'

const periods: Array<{ id: Period; label: string }> = [
  { id: 'month', label: 'Month' },
  { id: 'quarter', label: 'Quarter' },
  { id: 'year', label: 'Year' },
]

const ranges: Record<Period, string> = {
  month: '1 Sep – 20 Sep',
  quarter: '1 Jul – 20 Sep',
  year: '1 Jan – 20 Sep',
}

export interface TopbarProps {
  period: Period
  onPeriod: (period: Period) => void
  query: string
  onQuery: (query: string) => void
  onNewInvoice: () => void
}

export function Topbar({ period, onPeriod, query, onQuery, onNewInvoice }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar__heading">
        <h1>Receivables</h1>
        <p>
          {period === 'month' ? 'Month' : period === 'quarter' ? 'Quarter' : 'Year'} to date ·{' '}
          {ranges[period]}
        </p>
      </div>

      <div className="topbar__tools">
        <label className="field" htmlFor="global-search">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" fill="none">
            <circle cx="6.2" cy="6.2" r="4.2" stroke="currentColor" strokeWidth="1.4" />
            <path
              d="M9.4 9.4L12 12"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          <input
            id="global-search"
            type="search"
            placeholder="Search clients, refs"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
          />
        </label>

        <fieldset className="segmented" data-docent="period">
          <legend className="visually-hidden">Period</legend>
          {periods.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={period === p.id}
              onClick={() => onPeriod(p.id)}
            >
              {p.label}
            </button>
          ))}
        </fieldset>

        <button
          type="button"
          className="btn btn--primary"
          data-docent="new-invoice"
          onClick={onNewInvoice}
        >
          New invoice
        </button>
      </div>
    </header>
  )
}
