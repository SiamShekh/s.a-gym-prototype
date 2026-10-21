import { useSelector } from 'react-redux'
import { money, statusOf } from '../lib/memberUtils'

const MONTHS = ['মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্ট', 'অক্টো']

export default function OverviewPage() {
  const members = useSelector((s) => s.members.list)
  const total = members.length
  const active = members.filter((m) => statusOf(m).key === 'active').length
  const expiring = members.filter((m) => statusOf(m).key === 'expiring').length
  const expired = members.filter((m) => statusOf(m).key === 'expired').length
  const revenue = members.filter((m) => m.paid).reduce((sum, m) => sum + m.amount, 0)
  const vals = [3200, 4500, 3800, 5200, 4100, revenue]
  const max = Math.max(...vals, 1)

  const p1 = members.filter((m) => m.plan === '30:1000' || m.plan === '30:500').length
  const p3 = members.filter((m) => m.plan === '90:2500' || m.plan === '90:1200').length
  const py = members.filter((m) => m.plan === '365:10000' || m.plan === '365:4000').length
  const plans = [
    ['১ মাস প্যাকেজ', p1, 'fill-content'],
    ['৩ মাস প্যাকেজ', p3, 'fill-primary'],
    ['১২ মাস প্যাকেজ', py, 'fill-muted'],
  ]

  const cards = [
    [money(revenue), 'এই মাসের আয়', `↑ ${total} সদস্যের মোট আয়`, 'tone-content'],
    [String(total), 'মোট সদস্য', `${active} জন সক্রিয়`, 'tone-content'],
    [String(expiring), 'মেয়াদ শেষ হচ্ছে', 'আগামী ৭ দিনে', 'tone-muted'],
    [String(expired), 'মেয়াদ শেষ', 'পেমেন্ট বাকি', 'tone-primary'],
  ]

  return (
    <>
      <div className="stats">
        {cards.map(([value, label, change, tone]) => (
          <article className="card bg-base-100 text-base-content" key={label}>
            <div className={`stat-value ${tone}`}>{value}</div>
            <div className="stat-label">{label}</div>
            <div className={`stat-change ${tone}`}>{change}</div>
          </article>
        ))}
      </div>
      <div className="dash-split">
      <section className="card bg-base-100 text-base-content">
        <h2 className="section-title">মাসিক আয় (৬ মাস)</h2>
        <div className="chart">
          {vals.map((v, i) => (
            <div className="bar-col" key={MONTHS[i]}>
              <div className="bar-val">৳{(v / 1000).toFixed(1)}k</div>
              <div className="bar bg-primary" style={{ height: `${(v / max) * 90 + 10}px` }} />
              <div className="bar-label">{MONTHS[i]}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="card bg-base-100 text-base-content" style={{ marginTop: 16 }}>
        <h2 className="section-title">প্যাকেজ বিতরণ</h2>
        {plans.map(([label, count, fill]) => {
          const pct = total === 0 ? 0 : Math.round((count * 100) / total)
          return (
            <div className="progress-row" key={label}>
              <div className="progress-head">
                <span>{label}</span>
                <span className="light">{count} জন</span>
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
