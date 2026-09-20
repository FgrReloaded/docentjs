import { type Invoice, money } from '../data'

const statusLabel: Record<Invoice['status'], string> = {
  overdue: 'Overdue',
  sent: 'Sent',
  paid: 'Paid',
  draft: 'Draft',
}

export interface LedgerProps {
  rows: Invoice[]
  query: string
  onRemind: (invoice: Invoice) => void
  onOpen: (invoice: Invoice) => void
}

export function Ledger({ rows, query, onRemind, onOpen }: LedgerProps) {
  return (
    <section aria-labelledby="ledger-heading">
      <div className="section__head">
        <h2 id="ledger-heading">Open ledger</h2>
        <p className="micro">{rows.length} shown</p>
      </div>

      <table className="ledger" data-docent="receivables">
        <thead>
          <tr>
            <th scope="col">Ref</th>
            <th scope="col">Client</th>
            <th scope="col">Due</th>
            <th scope="col">Status</th>
            <th scope="col">
              <span className="visually-hidden">Actions</span>
            </th>
            <th scope="col">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.ref}>
              <td className="ledger__ref">#{row.ref}</td>
              <td className="ledger__client-cell">
                <span className="ledger__client">
                  <span className="avatar" aria-hidden="true">
                    {row.initials}
                  </span>
                  {row.client}
                </span>
              </td>
              <td className="ledger__due">
                {row.due}
                {row.daysLate > 0 && <b> · {row.daysLate}d late</b>}
              </td>
              <td className="ledger__status-cell">
                <span className="tag" data-state={row.status}>
                  {statusLabel[row.status]}
                </span>
              </td>
              <td className="ledger__actions-cell">
                <span className="ledger__actions">
                  <button
                    type="button"
                    className="btn btn--quiet btn--small"
                    onClick={() => onRemind(row)}
                  >
                    Remind
                  </button>
                  <button type="button" className="btn btn--small" onClick={() => onOpen(row)}>
                    Open
                  </button>
                </span>
              </td>
              <td className="ledger__amount">{money.format(row.amount)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td className="ledger__empty" colSpan={6}>
                <b>Nothing matches “{query}”</b>
                Search by client name, reference number, or an amount like 12400.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  )
}
