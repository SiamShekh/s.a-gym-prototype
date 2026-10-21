import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import {
  GYM_PHONE,
  daysLeft,
  formatDate,
  money,
  planLabel,
  whatsappUrl,
} from '../lib/memberUtils'
import { fetchMembers } from '../store/membersSlice'
import PaymentSheet from '../components/PaymentSheet'
import { hasPermission } from '../lib/permissions'

export default function DuePage() {
  const dispatch = useDispatch()
  const list = useSelector((s) => s.members.list)
  const status = useSelector((s) => s.members.status)
  const adminRole = useSelector((s) => s.auth.adminRole)
  const permissions = useSelector((s) => s.auth.permissions)
  const canPay = hasPermission(adminRole, permissions, 'accept_payment')
  const [payId, setPayId] = useState(null)

  const loadDue = () =>
    dispatch(fetchMembers({ status: 'unpaid', limit: 100 }))
      .unwrap()
      .catch(() => toast.error('ডেটা লোড ব্যর্থ'))

  useEffect(() => {
    loadDue()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch])

  const remind = (m) => {
    const d = daysLeft(m.expiry)
    const msg =
      d < 0
        ? `আপনার S.A Gym সদস্যপদের মেয়াদ শেষ। রিনিউ: ${GYM_PHONE}`
        : `আপনার S.A Gym পেমেন্ট বাকি। যোগাযোগ: ${GYM_PHONE}`
    window.open(whatsappUrl(m.phone, msg), '_blank', 'noopener')
    toast.success(`${m.name}-কে রিমাইন্ডার পাঠানো হয়েছে`)
  }

  return (
    <div className="stack">
      <section className="banner">
        <strong>বকেয়া সদস্য</strong>
        <p className="light" style={{ margin: '4px 0 0', fontSize: 12 }}>
          যাদের পেমেন্ট বাকি — রিনিউ করুন
        </p>
      </section>

      {status === 'loading' && !list.length && <p className="empty">লোড হচ্ছে…</p>}
      {status !== 'loading' && !list.length && <p className="empty">কোনো বকেয়া সদস্য নেই</p>}

      <div className="card-grid">
        {list.map((m) => {
          const d = daysLeft(m.expiry)
          return (
            <article className="card member bg-base-100" key={m.id}>
              <div className="row">
                <div className="grow">
                  <div className="name">{m.name}</div>
                  <div className="phone">
                    {m.code ? `${m.code} · ` : ''}
                    {m.phone} · {planLabel(m.plan)}
                  </div>
                </div>
                <span className="badge hot">{d < 0 ? 'মেয়াদ শেষ' : 'বকেয়া'}</span>
              </div>
              <div className="meta">
                মেয়াদ {formatDate(m.expiry)} · {money(m.amount)}
                {!m.paid ? ' · unpaid' : ''}
              </div>
              <div className="actions">
                <button className="btn-ghost" type="button" onClick={() => remind(m)}>
                  রিমাইন্ড
                </button>
                {canPay && (
                  <button className="btn-red" type="button" onClick={() => setPayId(m.id)}>
                    পেমেন্ট
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {payId && (
        <PaymentSheet
          memberId={payId}
          onClose={() => {
            setPayId(null)
            loadDue()
          }}
        />
      )}
    </div>
  )
}
