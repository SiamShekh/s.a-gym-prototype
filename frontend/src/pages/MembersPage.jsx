import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { formatDate, filterMembers, money, planLabel, statusOf } from '../lib/memberUtils'
import { deleteMember, requestPay } from '../store/membersSlice'
import MemberFormSheet from '../components/MemberFormSheet'

const FILTERS = [
  ['all', 'সকল'],
  ['active', 'সক্রিয়'],
  ['expiring', 'শেষ হচ্ছে'],
  ['expired', 'মেয়াদ শেষ'],
]

export default function MembersPage() {
  const members = useSelector((s) => s.members.list)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [editId, setEditId] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)

  const list = useMemo(() => filterMembers(members, query, filter), [members, query, filter])

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

  return (
    <>
      <div className="pills">
        {FILTERS.map(([key, label]) => (
          <button key={key} type="button" className={`pill${filter === key ? ' active' : ''}`} onClick={() => setFilter(key)}>
            {label}
          </button>
        ))}
      </div>
      <div className="search-wrap">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input className="search" placeholder="নাম বা ফোন দিয়ে খুঁজুন..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {list.length === 0 && <p className="empty">কোনো সদস্য নেই</p>}
      <div className="card-grid">
      {list.map((m) => {
        const status = statusOf(m)
        const hot = status.key === 'expired' || status.urgent
        return (
          <article className="card member" key={m.id}>
            <div className="row">
              <div className="grow">
                <div className="name">{m.name}</div>
                <div className="phone">{m.phone}{m.address ? ` · ${m.address}` : ''}</div>
              </div>
              <span className={`badge ${hot ? 'hot' : 'ok'}`}>{status.label}</span>
            </div>
            <div className="meta">
              {`যোগদান ${formatDate(m.join)} · মেয়াদ ${formatDate(m.expiry)}\nপ্যাকেজ: ${planLabel(m.plan)} · ${money(m.amount)}`}
            </div>
            <div className="actions">
              <button className="btn-ghost" type="button" onClick={() => setEditId(m.id)}>এডিট</button>
              <button className="btn-danger" type="button" onClick={() => setPendingDelete(m)}>মুছুন</button>
              {status.key === 'expired' && (
                <button
                  className="btn-ghost"
                  type="button"
                  onClick={() => {
                    dispatch(requestPay(m.id))
                    navigate('/payment')
                  }}
                >
                  পেমেন্ট
                </button>
              )}
            </div>
          </article>
        )
      })}
      </div>
      {editId && <MemberFormSheet memberId={editId} onClose={() => setEditId(null)} />}
      {pendingDelete && (
        <div className="overlay" onClick={() => setPendingDelete(null)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>মুছে ফেলবেন?</h3>
            <p>{pendingDelete.name}-কে মুছে ফেলবেন?</p>
            <div className="actions">
              <button className="btn-ghost" type="button" onClick={() => setPendingDelete(null)}>না</button>
              <button className="btn-danger" type="button" onClick={confirmDelete}>হ্যাঁ</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
