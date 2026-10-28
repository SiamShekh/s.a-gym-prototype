import { RANGE_PRESETS } from '../lib/dateRange'

export default function DateRangeFilter({ range, dateBasis = false }) {
  const basisLabel = range.dateBy === 'payment' ? 'পেমেন্টের তারিখ' : 'যোগদানের তারিখ'

  return (
    <div className="range-filter">
      <div className="pills" role="group" aria-label="তারিখের পরিসর">
        {RANGE_PRESETS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`pill${range.preset === key ? ' active' : ''}`}
            onClick={() => range.setPreset(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="date-filters">
        <label className="date-filter">
          <span>থেকে</span>
          <input
            className="field"
            type="date"
            value={range.from}
            max={range.to || undefined}
            onChange={(e) => range.setCustom(e.target.value, range.to)}
          />
        </label>
        <label className="date-filter">
          <span>পর্যন্ত</span>
          <input
            className="field"
            type="date"
            value={range.to}
            min={range.from || undefined}
            onChange={(e) => range.setCustom(range.from, e.target.value)}
          />
        </label>
      </div>

      {dateBasis && (
        <div className="pills" role="group" aria-label="তারিখের ধরন">
          <button
            type="button"
            className={`pill${range.dateBy !== 'payment' ? ' active' : ''}`}
            onClick={() => range.setDateBy('join')}
          >
            যোগদানের তারিখ
          </button>
          <button
            type="button"
            className={`pill${range.dateBy === 'payment' ? ' active' : ''}`}
            onClick={() => range.setDateBy('payment')}
          >
            পেমেন্টের তারিখ
          </button>
        </div>
      )}

      <p className="range-banner">
        সক্রিয় পরিসর: {range.label}
        {dateBasis && range.preset !== 'all' ? ` · ${basisLabel}` : ''}
      </p>
    </div>
  )
}
