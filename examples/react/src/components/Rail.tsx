const nav = [
  { label: 'Overview', count: null, current: true },
  { label: 'Invoices', count: 12, current: false },
  { label: 'Clients', count: 34, current: false },
  { label: 'Expenses', count: null, current: false },
  { label: 'Reports', count: null, current: false },
]

export interface RailProps {
  onSetupTour: () => void
  onReconcileTour: () => void
  onReleaseTour: () => void
}

export function Rail({ onSetupTour, onReconcileTour, onReleaseTour }: RailProps) {
  return (
    <aside className="rail">
      <div className="rail__brand">
        <svg className="rail__mark" width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
          <rect
            x="0.75"
            y="0.75"
            width="24.5"
            height="24.5"
            rx="6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M7 8.5h12M7 13h12M7 17.5h7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <span className="rail__name">Ledgerline</span>
        <span className="rail__org">Kessler Studio · GBP</span>
      </div>

      <nav className="rail__group" aria-label="Sections">
        {nav.map((item) => (
          <a
            key={item.label}
            className="rail__link"
            href={`#${item.label.toLowerCase()}`}
            {...(item.current ? { 'aria-current': 'page' as const } : {})}
          >
            {item.label}
            {item.count !== null && <span className="rail__count num">{item.count}</span>}
          </a>
        ))}
      </nav>

      <div className="rail__group" data-docent="accounts">
        <p className="micro">Accounts</p>
        <div className="rail__accounts">
          <span className="rail__account">
            Operating · 1129 <b className="num">£41,208</b>
          </span>
          <span className="rail__account">
            Reserve · 4402 <b className="num">£96,000</b>
          </span>
        </div>
      </div>

      <div className="rail__group" data-docent="guides">
        <p className="micro">Guides</p>
        <button type="button" className="rail__link" onClick={onSetupTour}>
          Setup tour
        </button>
        <button type="button" className="rail__link" onClick={onReconcileTour}>
          Month-end reconcile
        </button>
        <button type="button" className="rail__link" onClick={onReleaseTour}>
          What’s new in 14
        </button>
      </div>

      <div className="rail__foot" data-docent="plan">
        <p>
          <b>Studio plan</b> · renews 4 Oct
        </p>
        <div className="rail__meter">
          <span style={{ width: '62%' }} />
        </div>
        <p className="rail__note">62 of 100 invoices this month</p>
      </div>
    </aside>
  )
}
