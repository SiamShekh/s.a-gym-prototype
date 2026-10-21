import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { money, planLabel } from '../lib/memberUtils'
import { useGetPaymentsQuery } from '../api/saApi'

const METHODS = [
  ['all', 'সব'],
  ['cash', 'নগদ'],
  ['bkash', 'bKash'],
  ['nagad', 'Nagad'],
  ['rocket', 'Rocket'],
]

function formatWhen(iso) {
  if (!iso) return '—'
  const [y, m, d] = String(iso).split('-')
  return `${d}/${m}/${y}`
}

export default function PaymentsPage() {
  const [method, setMethod] = useState('all')
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, isFetching } = useGetPaymentsQuery({
    page,
    limit: 30,
    method,
  })

  useEffect(() => {
    if (isError) toast.error('পেমেন্ট লোড ব্যর্থ')
  }, [isError])

  const rows = data?.payments || []
  const totalAmount = data?.totalAmount || 0
  const pagination = data?.pagination
  const loading = isLoading || isFetching

  return (
    <div className="stack">
      <section className="actions-hero">
        <div>
          <div className="actions-hero-kicker">Payments</div>
          <h2 className="actions-hero-title">পেমেন্ট হিস্টোরি</h2>
          <p className="light" style={{ margin: '6px 0 0', fontSize: 13 }}>
            সব গ্রহণ করা পেমেন্টের তালিকা
          </p>
        </div>
        <div className="actions-hero-stat">
          <strong>{money(totalAmount)}</strong>
          <span>মোট আয় (ফিল্টার)</span>
        </div>
      </section>

      <div className="pills">
        {METHODS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`pill${method === key ? ' active' : ''}`}
            onClick={() => {
              setMethod(key)
              setPage(1)
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && !rows.length && <p className="empty">লোড হচ্ছে…</p>}
      {!loading && !rows.length && <p className="empty">কোনো পেমেন্ট নেই</p>}

      <div className="card-grid">
        {rows.map((p) => (
          <article className="card member bg-base-100" key={p.id}>
            <div className="row">
              <div className="grow">
                <div className="name">{p.memberName}</div>
                <div className="phone">
                  {p.memberCode ? `${p.memberCode} · ` : ''}
                  {p.phone || '—'} · {planLabel(p.plan)}
                </div>
              </div>
              <div className="tone-primary" style={{ fontWeight: 700 }}>{money(p.amount)}</div>
            </div>
            <div className="meta">
              {formatWhen(p.paidAt)} · {String(p.method).toUpperCase()}
              {p.adminName ? ` · ${p.adminName}` : ''}
              {p.note ? `\n${p.note}` : ''}
            </div>
          </article>
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          <button className="btn-ghost" type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            আগে
          </button>
          <div className="pagination-status">{pagination.page} / {pagination.totalPages}</div>
          <button
            className="btn-ghost"
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            পরে
          </button>
        </div>
      )}
    </div>
  )
}
