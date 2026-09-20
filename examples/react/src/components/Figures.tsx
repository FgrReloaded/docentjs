import { money } from '../data'

export function Figures() {
  return (
    <section className="figures" data-docent="figures" aria-label="Key figures">
      <div className="figure">
        <p className="micro">Outstanding</p>
        <p className="figure__value num">{money.format(63210)}</p>
        <p className="figure__note">
          <b>12 invoices</b> open of {money.format(84210)} billed
        </p>
      </div>

      <div className="figure figure--alert" data-docent="figure-overdue">
        <p className="micro">Overdue</p>
        <p className="figure__value num">{money.format(21480)}</p>
        <p className="figure__note">
          <b>3 invoices</b> · oldest 23 days out
        </p>
      </div>

      <div className="figure">
        <p className="micro">Collected this quarter</p>
        <p className="figure__value num">{money.format(168900)}</p>
        <p className="figure__note">
          <b>+12%</b> on Q2 · average settle 19 days
        </p>
      </div>
    </section>
  )
}
