import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { toast } from 'sonner'
import { api } from '../api/client'
import Overlay from '../components/Overlay'
import { money, today } from '../lib/memberUtils'

const CATEGORIES = [
  ['rent', 'ভাড়া'],
  ['salary', 'বেতন'],
  ['utilities', 'বিল'],
  ['equipment', 'যন্ত্রপাতি'],
  ['maintenance', 'রক্ষণাবেক্ষণ'],
  ['other', 'অন্যান্য'],
]

const labelOf = Object.fromEntries(CATEGORIES)

function formatWhen(iso) {
  if (!iso) return '—'
  const [y, m, d] = String(iso).split('-')
  return `${d}/${m}/${y}`
}

export default function ExpensesPage() {
  const token = useSelector((s) => s.auth.token)
  const [rows, setRows] = useState([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      title: '',
      amount: '',
      category: 'other',
      date: today(),
      note: '',
    },
  })

  const load = async (p = page) => {
    setLoading(true)
    try {
      const data = await api(`/expenses?page=${p}&limit=30`, { token })
      setRows(data.expenses || [])
      setTotalAmount(data.totalAmount || 0)
      setPagination(data.pagination)
    } catch {
      toast.error('খরচ লোড ব্যর্থ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page])

  const onSubmit = async (values) => {
    try {
      await api('/expenses', {
        method: 'POST',
        token,
        body: {
          title: values.title,
          amount: Number(values.amount),
          category: values.category,
          date: values.date,
          note: values.note || '',
        },
      })
      toast.success('খরচ যোগ হয়েছে')
      setOpen(false)
      reset({ title: '', amount: '', category: 'other', date: today(), note: '' })
      setPage(1)
      await load(1)
    } catch {
      toast.error('খরচ যোগ ব্যর্থ')
    }
  }

  const remove = async (expense) => {
    try {
      await api(`/expenses/${expense.id}`, { method: 'DELETE', token })
      toast.success('খরচ মুছে ফেলা হয়েছে')
      await load(page)
    } catch {
      toast.error('মুছতে ব্যর্থ')
    }
  }

  return (
    <div className="stack">
      <section className="actions-hero">
        <div>
          <div className="actions-hero-kicker">Expenses</div>
          <h2 className="actions-hero-title">খরচ হিসাব</h2>
          <p className="light" style={{ margin: '6px 0 0', fontSize: 13 }}>
            ভাড়া, বেতন, বিলসহ সব খরচ
          </p>
        </div>
        <div className="actions-hero-stat">
          <strong>{money(totalAmount)}</strong>
          <span>মোট খরচ</span>
        </div>
      </section>

      <button className="btn-red block" type="button" onClick={() => setOpen(true)}>
        নতুন খরচ যোগ
      </button>

      {loading && !rows.length && <p className="empty">লোড হচ্ছে…</p>}
      {!loading && !rows.length && <p className="empty">কোনো খরচ নেই</p>}

      <div className="card-grid">
        {rows.map((e) => (
          <article className="card member expense-card bg-base-100" key={e.id}>
            <div className="expense-row">
              <div className="grow">
                <div className="name">{e.title}</div>
                <div className="phone">
                  {labelOf[e.category] || e.category} · {formatWhen(e.date)}
                  {e.adminName ? ` · ${e.adminName}` : ''}
                </div>
              </div>
              <div className="expense-amount">{money(e.amount)}</div>
            </div>
            {e.note ? <div className="meta">{e.note}</div> : null}
            <div className="actions">
              <button className="btn-danger" type="button" onClick={() => remove(e)}>
                মুছুন
              </button>
            </div>
          </article>
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          <button className="btn-ghost" type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
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

      {open && (
        <Overlay onClose={() => setOpen(false)}>
          <form className="sheet" onClick={(ev) => ev.stopPropagation()} onSubmit={handleSubmit(onSubmit)}>
            <div className="handle" />
            <h3 style={{ margin: '0 0 8px' }}>নতুন খরচ</h3>

            <label className="lbl">শিরোনাম <i>*</i></label>
            <input className="field" placeholder="যেমন: দোকানের ভাড়া" {...register('title', { required: true })} />

            <label className="lbl">পরিমাণ <i>*</i></label>
            <input
              className="field"
              type="number"
              inputMode="numeric"
              min="1"
              {...register('amount', { required: true, min: 1, valueAsNumber: true })}
            />

            <div className="expense-form-grid">
              <div>
                <label className="lbl">ক্যাটাগরি</label>
                <select className="select" {...register('category')}>
                  {CATEGORIES.map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="lbl">তারিখ <i>*</i></label>
                <input className="field" type="date" {...register('date', { required: true })} />
              </div>
            </div>

            <label className="lbl">নোট</label>
            <input className="field" placeholder="ঐচ্ছিক" {...register('note')} />

            <button className="btn-red block" type="submit" disabled={isSubmitting} style={{ marginTop: 16 }}>
              সংরক্ষণ
            </button>
          </form>
        </Overlay>
      )}
    </div>
  )
}
