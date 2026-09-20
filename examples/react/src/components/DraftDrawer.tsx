import { money } from '../data'

const lines = [
  { description: 'Brand system — phase 2', qty: '1', rate: 3200, amount: 3200 },
  { description: 'Art direction, 6 days', qty: '6', rate: 640, amount: 3840 },
  { description: 'Print supervision', qty: '2', rate: 480, amount: 960 },
]

const subtotal = lines.reduce((sum, line) => sum + line.amount, 0)
const retainer = -1200
const vat = Math.round((subtotal + retainer) * 0.2)
const total = subtotal + retainer + vat

export interface DraftDrawerProps {
  onClose: () => void
  onSend: () => void
}

export function DraftDrawer({ onClose, onSend }: DraftDrawerProps) {
  return (
    <aside className="drawer" aria-label="Draft invoice 1043">
      <div className="drawer__head">
        <div>
          <h2>Draft #1043</h2>
          <p>Two Rivers Press · terms net 30</p>
        </div>
        <button type="button" className="btn btn--quiet btn--small" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="drawer__body">
        <table className="lines">
          <thead>
            <tr>
              <th scope="col">Description</th>
              <th scope="col">Qty</th>
              <th scope="col">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.description}>
                <td>{line.description}</td>
                <td>{line.qty}</td>
                <td>{money.format(line.amount)}</td>
              </tr>
            ))}
            <tr>
              <td>Retainer credit</td>
              <td>—</td>
              <td>{money.format(retainer)}</td>
            </tr>
            <tr>
              <td>VAT 20%</td>
              <td>—</td>
              <td>{money.format(vat)}</td>
            </tr>
          </tbody>
        </table>

        <div className="drawer__total" data-docent="draft-total">
          <span className="micro">Total due</span>
          <b>{money.format(total)}</b>
        </div>

        <p style={{ fontSize: '0.8125rem', color: 'var(--ink-2)' }}>
          Reminders go out on day 3, 14 and 30. Two Rivers pays in 11 days on average.
        </p>
      </div>

      <div className="drawer__foot">
        <button type="button" className="btn" onClick={onClose}>
          Save draft
        </button>
        <button
          type="button"
          className="btn btn--primary"
          data-docent="draft-send"
          onClick={onSend}
        >
          Send invoice
        </button>
      </div>
    </aside>
  )
}
