import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import {
  GYM_PHONE,
  daysLeft,
  formatDate,
  money,
  planLabel,
  statusOf,
  whatsappUrl,
} from '../lib/memberUtils'
import { deleteMember, fetchMembers } from '../store/membersSlice'
import MemberFormSheet from '../components/MemberFormSheet'
import Overlay from '../components/Overlay'
import PaymentSheet from '../components/PaymentSheet'

const PAGE_SIZE = 20

const FILTERS = [
  ['all', 'সকল'],
  ['active', 'সক্রিয়'],
  ['expiring', 'শেষ হচ্ছে'],
  ['expired', 'মেয়াদ শেষ'],
  ['unpaid', 'বকেয়া'],
  ['due', 'ডিউ'],
]

function Icon({ d }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function alertMessage(member) {
  const d = daysLeft(member.expiry)
  if (d < 0) {
    return `আপনার S.A Gym সদস্যপদের মেয়াদ শেষ হয়ে গেছে। রিনিউ করতে কল করুন: ${GYM_PHONE}`
  }
  if (d <= 7) {
    return `আপনার S.A Gym সদস্যপদের মেয়াদ ${d} দিনের মধ্যে শেষ হবে। রিনিউ করুন: ${GYM_PHONE}`
  }
  return `S.A Gym থেকে শুভেচ্ছা। আপনার সদস্যপদ সক্রিয় আছে। প্রয়োজনে কল করুন: ${GYM_PHONE}`
}

function initialOf(name) {
  const trimmed = String(name || '').trim()
  return trimmed ? trimmed[0] : '?'
}

export default function MembersPage() {
  const dispatch = useDispatch()
  const list = useSelector((s) => s.members.list)
  const pagination = useSelector((s) => s.members.pagination)
  const status = useSelector((s) => s.members.status)
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [page, setPage] = useState(1)
  const [editId, setEditId] = useState(null)
  const [payId, setPayId] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedQuery(query.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(id)
  }, [query])

  useEffect(() => {
    if (pagination && page > pagination.totalPages) {
      setPage(pagination.totalPages)
    }
  }, [pagination, page])

  useEffect(() => {
    dispatch(
      fetchMembers({
        page,
        limit: PAGE_SIZE,
        q: debouncedQuery,
        status: filter,
      }),
    )
      .unwrap()
      .catch(() => toast.error('ডেটা লোড ব্যর্থ'))
  }, [dispatch, page, debouncedQuery, filter])

  const total = pagination?.total ?? list.length
  const totalPages = pagination?.totalPages ?? 1
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)

  const confirmDelete = async () => {
    const member = pendingDelete
    setPendingDelete(null)
    try {
      const name = await dispatch(deleteMember(member)).unwrap()
      toast.success(`${name} মুছে ফেলা হয়েছে`)
    } catch {
      toast.error('মুছতে ব্যর্থ')
    }
  }

  const sendAlert = (member) => {
    window.open(whatsappUrl(member.phone, alertMessage(member)), '_blank', 'noopener')
    toast.success(`${member.name}-কে অ্যালার্ট পাঠানো হয়েছে`)
  }

  return (
    <>
      <div className="pills">
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`pill${filter === key ? ' active' : ''}`}
            onClick={() => {
              setFilter(key)
              setPage(1)
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="search-wrap">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          className="search"
          placeholder="নাম, ফোন বা ID দিয়ে খুঁজুন..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="page-meta">
        <span className="light">
          {total === 0 ? 'কোনো সদস্য নেই' : `${from}–${to} / মোট ${total} জন`}
        </span>
        {status === 'loading' && <span className="light">লোড হচ্ছে…</span>}
      </div>

      {list.length === 0 && status !== 'loading' && <p className="empty">কোনো সদস্য নেই</p>}
      <div className="card-grid">
        {list.map((m) => {
          const memberStatus = statusOf(m)
          const hot = memberStatus.key === 'expired' || memberStatus.urgent
          const cardTone =
            memberStatus.key === 'expired' ? 'is-expired' : memberStatus.urgent ? 'is-urgent' : ''

          return (
            <article
              className={`member-card bg-base-100 text-base-content ${cardTone}`.trim()}
              key={m.id}
            >
              <div className="member-card-head">
                <div className="member-avatar" aria-hidden>{initialOf(m.name)}</div>
                <div className="grow">
                  <div className="member-card-title">
                    <div className="name">{m.name}</div>
                    <span className={`badge ${hot ? 'hot' : 'ok'}`}>{memberStatus.label}</span>
                  </div>
                  <div className="phone">
                    {m.code ? `${m.code} · ` : ''}
                    {m.phone}
                    {m.address ? ` · ${m.address}` : ''}
                  </div>
                </div>
              </div>

              <div className="member-facts">
                <div className="member-fact">
                  <span>প্যাকেজ</span>
                  <strong>{planLabel(m.plan)}</strong>
                </div>
                <div className="member-fact">
                  <span>মেয়াদ</span>
                  <strong>{formatDate(m.expiry)}</strong>
                </div>
                <div className="member-fact">
                  <span>পরিমাণ</span>
                  <strong>{money(m.amount)}</strong>
                </div>
              </div>

              <div className="member-actions">
                <button className="member-action" type="button" onClick={() => setEditId(m.id)}>
                  <Icon d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                  এডিট
                </button>
                <button
                  className="member-action alert"
                  type="button"
                  title="মেয়াদ অ্যালার্ট পাঠান"
                  onClick={() => sendAlert(m)}
                >
                  <Icon d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9M10 21h4" />
                  অ্যালার্ট
                </button>
                <button className="member-action pay" type="button" onClick={() => setPayId(m.id)}>
                  <Icon d="M4 8h16v10H4zM4 12h16" />
                  পেমেন্ট
                </button>
                <button
                  className="member-action danger"
                  type="button"
                  onClick={() => setPendingDelete(m)}
                >
                  <Icon d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  মুছুন
                </button>
              </div>
            </article>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            type="button"
            className="btn-ghost"
            disabled={page <= 1 || status === 'loading'}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            আগের
          </button>
          <span className="pagination-status">
            পৃষ্ঠা {page} / {totalPages}
          </span>
          <button
            type="button"
            className="btn-ghost"
            disabled={page >= totalPages || status === 'loading'}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            পরের
          </button>
        </div>
      )}

      {editId && <MemberFormSheet memberId={editId} onClose={() => setEditId(null)} />}
      {payId && <PaymentSheet memberId={payId} onClose={() => setPayId(null)} />}
      {pendingDelete && (
        <Overlay onClose={() => setPendingDelete(null)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>মুছে ফেলবেন?</h3>
            <p>{pendingDelete.name}-কে মুছে ফেলবেন?</p>
            <div className="actions">
              <button className="btn-ghost" type="button" onClick={() => setPendingDelete(null)}>না</button>
              <button className="btn-danger" type="button" onClick={confirmDelete}>হ্যাঁ</button>
            </div>
          </div>
        </Overlay>
      )}
    </>
  )
}
