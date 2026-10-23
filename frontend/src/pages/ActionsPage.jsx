import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import { addDays, today } from '../lib/memberUtils'
import { fetchActions } from '../store/actionsSlice'

const PAGE_SIZE = 30

const FILTERS = [
  ['all', 'সব'],
  ['accept_payment', 'পেমেন্ট'],
  ['create_member', 'নতুন সদস্য'],
  ['update_member', 'আপডেট'],
  ['delete_member', 'ডিলিট'],
  ['create_expense', 'খরচ'],
  ['send_sms', 'SMS'],
  ['create_admin', 'অ্যাডমিন'],
  ['update_profile', 'প্রোফাইল'],
  ['login', 'লগইন'],
]

const DATE_PRESETS = [
  ['all', 'সব তারিখ'],
  ['today', 'আজ'],
  ['7d', '৭ দিন'],
  ['30d', '৩০ দিন'],
]

const TYPE_META = {
  accept_payment: {
    label: 'পেমেন্ট',
    tone: 'pay',
    icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  },
  create_member: {
    label: 'নতুন সদস্য',
    tone: 'create',
    icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8v6M22 11h-6',
  },
  update_member: {
    label: 'আপডেট',
    tone: 'update',
    icon: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  },
  delete_member: {
    label: 'ডিলিট',
    tone: 'delete',
    icon: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  },
  login: {
    label: 'লগইন',
    tone: 'login',
    icon: 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3',
  },
  create_admin: {
    label: 'অ্যাডমিন',
    tone: 'create',
    icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8v6M22 11h-6',
  },
  create_expense: {
    label: 'খরচ',
    tone: 'update',
    icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  },
  delete_expense: {
    label: 'খরচ ডিলিট',
    tone: 'delete',
    icon: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  },
  send_sms: {
    label: 'SMS',
    tone: 'pay',
    icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  },
  update_profile: {
    label: 'প্রোফাইল',
    tone: 'update',
    icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  },
}

function rangeForPreset(key) {
  if (key === 'today') return { from: today(), to: today() }
  if (key === '7d') return { from: addDays(today(), -6), to: today() }
  if (key === '30d') return { from: addDays(today(), -29), to: today() }
  return { from: '', to: '' }
}

function activePreset(from, to) {
  for (const [key] of DATE_PRESETS) {
    if (key === 'all') {
      if (!from && !to) return 'all'
      continue
    }
    const range = rangeForPreset(key)
    if (range.from === from && range.to === to) return key
  }
  return 'custom'
}

function formatWhen(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('bn-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function groupKey(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'অন্যান্য'
  const todayDate = new Date()
  const yday = new Date()
  yday.setDate(todayDate.getDate() - 1)
  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  if (sameDay(d, todayDate)) return 'আজ'
  if (sameDay(d, yday)) return 'গতকাল'
  return d.toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function Icon({ d }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function metaLine(action) {
  const m = action.meta || {}
  const parts = []
  if (m.memberName) parts.push(m.memberName)
  if (m.phone) parts.push(m.phone)
  if (m.amount != null) parts.push(`৳${Number(m.amount).toLocaleString('bn-BD')}`)
  if (m.method) parts.push(String(m.method).toUpperCase())
  return parts.join(' · ')
}

export default function ActionsPage() {
  const dispatch = useDispatch()
  const list = useSelector((s) => s.actions.list)
  const status = useSelector((s) => s.actions.status)
  const pagination = useSelector((s) => s.actions.pagination)
  const [type, setType] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (pagination && page > pagination.totalPages) {
      setPage(pagination.totalPages)
    }
  }, [pagination, page])

  useEffect(() => {
    dispatch(fetchActions({ page, limit: PAGE_SIZE, type, from, to }))
      .unwrap()
      .catch(() => toast.error('অ্যাকশন লোড ব্যর্থ'))
  }, [dispatch, page, type, from, to])

  const groups = []
  for (const action of list) {
    const key = groupKey(action.createdAt)
    const last = groups[groups.length - 1]
    if (!last || last.title !== key) groups.push({ title: key, items: [action] })
    else last.items.push(action)
  }

  const total = pagination?.total ?? list.length
  const totalPages = pagination?.totalPages ?? 1
  const rangeFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeTo = Math.min(page * PAGE_SIZE, total)
  const datePreset = activePreset(from, to)

  const applyPreset = (key) => {
    const range = rangeForPreset(key)
    setFrom(range.from)
    setTo(range.to)
    setPage(1)
  }

  return (
    <div className="stack">
      <div className="pills">
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`pill${type === key ? ' active' : ''}`}
            onClick={() => {
              setType(key)
              setPage(1)
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="pills">
        {DATE_PRESETS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`pill${datePreset === key ? ' active' : ''}`}
            onClick={() => applyPreset(key)}
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
            value={from}
            max={to || undefined}
            onChange={(e) => {
              setFrom(e.target.value)
              setPage(1)
            }}
          />
        </label>
        <label className="date-filter">
          <span>পর্যন্ত</span>
          <input
            className="field"
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => {
              setTo(e.target.value)
              setPage(1)
            }}
          />
        </label>
        {(from || to) && (
          <button
            className="btn-ghost"
            type="button"
            onClick={() => applyPreset('all')}
          >
            মুছুন
          </button>
        )}
      </div>

      <div className="page-meta">
        <span className="light">
          {total === 0 ? 'কোনো অ্যাকশন নেই' : `${rangeFrom}–${rangeTo} / মোট ${total}`}
        </span>
        {status === 'loading' && <span className="light">লোড হচ্ছে…</span>}
      </div>

      {status === 'loading' && !list.length && <p className="empty">লোড হচ্ছে…</p>}
      {status === 'error' && <p className="empty">লোড ব্যর্থ — আবার চেষ্টা করুন</p>}
      {status !== 'loading' && !list.length && (
        <p className="empty">এই ফিল্টারে কোনো অ্যাকশন নেই।</p>
      )}

      {groups.map((group) => (
        <section key={group.title}>
          <div className="section-label">{group.title}</div>
          <div className="action-timeline">
            {group.items.map((action) => {
              const meta = TYPE_META[action.type] || TYPE_META.update_member
              const detail = metaLine(action)
              return (
                <article className={`action-item tone-${meta.tone}`} key={action.id}>
                  <div className={`action-icon tone-${meta.tone}`}>
                    <Icon d={meta.icon} />
                  </div>
                  <div className="action-body">
                    <div className="action-top">
                      <span className={`action-chip tone-${meta.tone}`}>{meta.label}</span>
                      <time className="action-time">{formatWhen(action.createdAt)}</time>
                    </div>
                    <div className="action-summary">{action.summary}</div>
                    {detail && <div className="action-meta">{detail}</div>}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ))}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn-ghost"
            type="button"
            disabled={page <= 1 || status === 'loading'}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            আগে
          </button>
          <div className="pagination-status">
            পৃষ্ঠা {page} / {totalPages}
          </div>
          <button
            className="btn-ghost"
            type="button"
            disabled={page >= totalPages || status === 'loading'}
            onClick={() => setPage((p) => p + 1)}
          >
            পরে
          </button>
        </div>
      )}
    </div>
  )
}
