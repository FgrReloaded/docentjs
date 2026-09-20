import { activity, aging, money } from '../data'

const total = aging.reduce((sum, band) => sum + band.amount, 0)

export function Notes() {
  return (
    <div className="notes">
      <section aria-labelledby="aging-heading" data-docent="aging">
        <div className="section__head">
          <h2 id="aging-heading">Aging</h2>
          <p className="micro">{money.format(total)}</p>
        </div>

        {/* One measure, split four ways: width is the only encoding, darker
            means older, and every band is labelled beside the bar. */}
        <div className="aging__bar" role="img" aria-label="Receivables by age band">
          {aging.map((band) => (
            <span
              key={band.band}
              style={{
                width: `${((band.amount / total) * 100).toFixed(1)}%`,
                background: band.tone,
              }}
            />
          ))}
        </div>

        <div className="aging__key">
          {aging.map((band) => (
            <span className="aging__row" key={band.band}>
              <span className="aging__swatch" style={{ background: band.tone }} />
              {band.band}
              <b>{money.format(band.amount)}</b>
            </span>
          ))}
        </div>
      </section>

      <section aria-labelledby="activity-heading" data-docent="activity">
        <div className="section__head">
          <h2 id="activity-heading">Activity</h2>
          <p className="micro">Today</p>
        </div>
        <ul className="activity">
          {activity.map((entry) => (
            <li key={entry.text + entry.time}>
              <time>{entry.time}</time>
              <span>
                <b>{entry.text}</b>
                <br />
                {entry.detail}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
