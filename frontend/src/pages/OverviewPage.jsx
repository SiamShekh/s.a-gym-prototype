import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { money } from '../lib/memberUtils'
import { useGetOverviewQuery } from '../api/saApi'
import DateRangeFilter from '../components/DateRangeFilter'
import { useDateRange } from '../lib/useDateRange'

export default function OverviewPage() {
  const range = useDateRange({ defaultPreset: 'month' })
  const query = !range.ready
    ? {}
    : range.preset === 'all'
      ? { scope: 'everything' }
      : { from: range.from, to: range.to }
  const { data: report, isLoading, isError, isFetching } = useGetOverviewQuery(query, {
    skip: !range.ready,
  })

  useEffect(() => {
    if (isError) toast.error('রিপোর্ট লোড ব্যর্থ')
  }, [isError])

  if ((isLoading || isFetching) && !report) {
    return (
      <>
        <DateRangeFilter range={range} />
        <p className="empty">লোড হচ্ছে…</p>
      </>
    )
  }

  const r = report || {
    scope: 'month',
    bucket: 'month',
    monthRevenue: 0,
    monthExpenses: 0,
    monthProfit: 0,
    totalMembers: 0,
    active: 0,
    expiring: 0,
    expired: 0,
    unpaid: 0,
    monthly: [],
    planDistribution: [],
  }

  const scope = r.scope || 'month'
  const incomeLabel = scope === 'range' ? 'আয়' : scope === 'everything' ? 'মোট আয়' : 'এই মাসের আয়'
  const profitLabel = scope === 'range' ? 'লাভ' : scope === 'everything' ? 'মোট লাভ' : 'এই মাসের লাভ'
  const membersLabel = scope === 'range' ? 'নতুন সদস্য' : 'মোট সদস্য'
  const expenseHint = scope === 'month' ? `এই মাস ${money(r.monthExpenses)}` : money(r.monthExpenses)
  const chartTitle = r.bucket === 'day' ? 'দৈনিক আয়' : scope === 'month' ? 'মাসিক আয় (৬ মাস)' : 'আয়'

  const vals = r.monthly.map((m) => m.revenue)
  const max = Math.max(...vals, 1)
  const totalPlans = r.planDistribution.reduce((s, p) => s + p.count, 0)

  const cards = [
    [money(r.monthRevenue), incomeLabel, `খরচ ${money(r.monthExpenses)}`, 'tone-content'],
    [money(r.monthProfit), profitLabel, r.monthProfit < 0 ? 'খরচ বেশি' : 'আয় − খরচ', r.monthProfit < 0 ? 'tone-primary' : 'tone-content'],
    [String(r.totalMembers), membersLabel, `${r.active} জন সক্রিয়`, 'tone-content'],
    [String(r.unpaid), 'বকেয়া', `${r.expired} মেয়াদ শেষ`, 'tone-primary'],
  ]

  return (
    <>
      <DateRangeFilter range={range} />

      <div className="dash-stats">
        {cards.map(([value, label, change, tone]) => (
          <article className="card bg-base-100 text-base-content" key={label}>
            <div className={`stat-value ${tone}`}>{value}</div>
            <div className="stat-label">{label}</div>
            <div className={`stat-change ${tone}`}>{change}</div>
          </article>
        ))}
      </div>

      <div className="quick-row">
        <Link className="card link-card" to="/payments">
          <strong>পেমেন্ট হিস্টোরি</strong>
          <span>সব পেমেন্ট দেখুন</span>
        </Link>
        <Link className="card link-card" to="/due">
          <strong>বকেয়া সদস্য</strong>
          <span>{r.unpaid} জন</span>
        </Link>
        <Link className="card link-card" to="/expenses">
          <strong>খরচ</strong>
          <span>{expenseHint}</span>
        </Link>
      </div>

      <div className="dash-split">
        <section className="card bg-base-100 text-base-content">
          <h2 className="section-title">{chartTitle}</h2>
          <div className={`chart${r.monthly.length > 8 ? ' chart-scroll' : ''}`}>
            {r.monthly.map((m) => (
              <div className="bar-col" key={m.key}>
                <div className="bar-val">৳{(m.revenue / 1000).toFixed(1)}k</div>
                <div
                  className="bar bg-primary"
                  style={{ height: `${(m.revenue / max) * 90 + 10}px` }}
                />
                <div className="bar-label">{m.label}</div>
              </div>
            ))}
          </div>
        </section>
        <section className="card bg-base-100 text-base-content h-full">
          <h2 className="section-title">{scope === 'range' ? 'প্যাকেজ (নতুন সদস্য)' : 'প্যাকেজ বিতরণ'}</h2>
          {r.planDistribution.map((p) => {
            const pct = totalPlans === 0 ? 0 : Math.round((p.count * 100) / totalPlans)
            const fill =
              p.label.includes('১ মাস') ? 'fill-content' : p.label.includes('৩') ? 'fill-primary' : 'fill-muted'
            return (
              <div className="progress-row" key={p.label}>
                <div className="progress-head">
                  <span>{p.label}</span>
                  <span className="light">{p.count} জন</span>
                </div>
                <div className="track">
                  <div className={`fill ${fill}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </section>
      </div>
    </>
  )
}
