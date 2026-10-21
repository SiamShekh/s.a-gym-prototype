import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { money } from '../lib/memberUtils'
import { api } from '../api/client'

export default function OverviewPage() {
  const token = useSelector((s) => s.auth.token)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    api('/reports/overview', { token })
      .then((data) => {
        if (alive) setReport(data.report)
      })
      .catch(() => toast.error('রিপোর্ট লোড ব্যর্থ'))
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [token])

  if (loading && !report) {
    return <p className="empty">লোড হচ্ছে…</p>
  }

  const r = report || {
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

  const vals = r.monthly.map((m) => m.revenue)
  const max = Math.max(...vals, 1)
  const totalPlans = r.planDistribution.reduce((s, p) => s + p.count, 0)

  const cards = [
    [money(r.monthRevenue), 'এই মাসের আয়', `খরচ ${money(r.monthExpenses)}`, 'tone-content'],
    [money(r.monthProfit), 'এই মাসের লাভ', r.monthProfit < 0 ? 'খরচ বেশি' : 'আয় − খরচ', r.monthProfit < 0 ? 'tone-primary' : 'tone-content'],
    [String(r.totalMembers), 'মোট সদস্য', `${r.active} জন সক্রিয়`, 'tone-content'],
    [String(r.unpaid), 'বকেয়া / ডিউ', `${r.expired} মেয়াদ শেষ`, 'tone-primary'],
  ]

  return (
    <>
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
          <span>{r.unpaid} জন ফলোআপ দরকার</span>
        </Link>
        <Link className="card link-card" to="/expenses">
          <strong>খরচ</strong>
          <span>এই মাস {money(r.monthExpenses)}</span>
        </Link>
      </div>

      <div className="dash-split">
        <section className="card bg-base-100 text-base-content">
          <h2 className="section-title">মাসিক আয় (৬ মাস)</h2>
          <div className="chart">
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
        <section className="card bg-base-100 text-base-content" style={{ marginTop: 16 }}>
          <h2 className="section-title">প্যাকেজ বিতরণ</h2>
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
          <div className="section-label" style={{ marginTop: 16 }}>সদস্য অবস্থা</div>
          <div className="meta">
            সক্রিয় {r.active} · শেষ হচ্ছে {r.expiring} · মেয়াদ শেষ {r.expired}
          </div>
        </section>
      </div>
    </>
  )
}
