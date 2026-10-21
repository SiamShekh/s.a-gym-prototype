import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { formatDate, money, planAmount, planLabel, statusOf } from '../lib/memberUtils'
import { requestPay } from '../store/membersSlice'

export default function BillingPage() {
  const members = useSelector((s) => s.members.list)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const paid = members.filter((m) => m.paid).reduce((s, m) => s + m.amount, 0)
  const due = members
    .filter((m) => !m.paid || statusOf(m).key === 'expired')
    .reduce((s, m) => s + planAmount(m.plan), 0)
  const stats = [
    [money(paid), 'পরিশোধিত', 'tone-content'],
    [money(due), 'বকেয়া', 'tone-primary'],
    [money(paid + due), 'মোট', 'tone-muted'],
  ]

  return (
    <>
      <div className="billing-stats">
        {stats.map(([value, label, tone]) => (
          <article className="card bg-base-100 text-base-content" key={label}>
            <div className={`stat-value ${tone}`} style={{ fontSize: 16 }}>{value}</div>
            <div className="stat-label">{label}</div>
          </article>
        ))}
      </div>
      <div className="card-grid">
      {members.map((m) => {
        const st = statusOf(m)
        const isPaid = m.paid && st.key !== 'expired'
        return (
          <article className="card member" key={m.id}>
            <div className="row">
              <div className="grow">
                <div className="name">{m.name}</div>
                <div className="phone">{m.phone}</div>
              </div>
              <span className={`badge ${isPaid ? 'hot' : 'ok'}`}>{isPaid ? 'পরিশোধিত' : 'বকেয়া'}</span>
            </div>
            <div className="meta">
              {`${planLabel(m.plan)} · ${money(m.amount)} · মেয়াদ ${formatDate(m.expiry)}`}
            </div>
            {!isPaid && (
              <div className="actions">
                <button
                  className="btn-red"
                  type="button"
                  onClick={() => {
                    dispatch(requestPay(m.id))
                    navigate('/payment')
                  }}
                >
                  পেমেন্ট
                </button>
              </div>
            )}
          </article>
        )
      })}
      </div>
    </>
  )
}
