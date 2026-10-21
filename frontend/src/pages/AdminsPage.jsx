import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import Overlay from '../components/Overlay'
import {
  useCreateAdminMutation,
  useDeleteAdminMutation,
  useGetAdminsQuery,
  useSetAdminActiveMutation,
  useUpdateAdminMutation,
} from '../api/saApi'
import {
  DEFAULT_STAFF_PERMISSIONS,
  PERMISSION_OPTIONS,
} from '../lib/permissions'

const emptyForm = {
  name: '',
  phone: '',
  password: '',
  role: 'staff',
  permissions: Object.fromEntries(DEFAULT_STAFF_PERMISSIONS.map((k) => [k, true])),
}

function selectedPermissions(values) {
  return PERMISSION_OPTIONS.map((p) => p.key).filter((k) => values.permissions?.[k])
}

function initialOf(name) {
  const t = String(name || 'A').trim()
  return t ? t[0].toUpperCase() : 'A'
}

function Icon({ d }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PermissionChecklist({ register, watch, prefix = 'permissions' }) {
  const values = watch(prefix) || {}
  return (
    <div className="perm-grid">
      {PERMISSION_OPTIONS.map((p) => {
        const on = Boolean(values[p.key])
        return (
          <label key={p.key} className={`perm-item${on ? ' is-on' : ''}`}>
            <input type="checkbox" {...register(`${prefix}.${p.key}`)} />
            <span className="perm-check" aria-hidden>
              {on ? <Icon d="M5 12l4 4L19 6" /> : null}
            </span>
            <span className="perm-label">{p.label}</span>
          </label>
        )
      })}
    </div>
  )
}

function PermissionChips({ permissions }) {
  if (!Array.isArray(permissions) || !permissions.length) {
    return <span className="admin-chip is-muted">কোনো অনুমতি নেই</span>
  }
  const map = Object.fromEntries(PERMISSION_OPTIONS.map((p) => [p.key, p.label]))
  const shown = permissions.slice(0, 4)
  const rest = permissions.length - shown.length
  return (
    <div className="admin-chips">
      {shown.map((key) => (
        <span className="admin-chip" key={key}>{map[key] || key}</span>
      ))}
      {rest > 0 && <span className="admin-chip is-more">+{rest}</span>}
    </div>
  )
}

export default function AdminsPage() {
  const role = useSelector((s) => s.auth.adminRole)
  const selfId = useSelector((s) => s.auth.adminId)
  const [open, setOpen] = useState(false)
  const [editAdmin, setEditAdmin] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')

  const skip = role !== 'owner'
  const { data: admins = [], isLoading, isError, error, isFetching } = useGetAdminsQuery(
    undefined,
    { skip },
  )
  const [createAdmin, { isLoading: creating }] = useCreateAdminMutation()
  const [updateAdmin, { isLoading: updating }] = useUpdateAdminMutation()
  const [deleteAdmin, { isLoading: deleting }] = useDeleteAdminMutation()
  const [setAdminActive] = useSetAdminActiveMutation()

  const {
    register,
    handleSubmit,
    reset,
    watch,
  } = useForm({ defaultValues: emptyForm })

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    watch: watchEdit,
  } = useForm({ defaultValues: emptyForm })

  const createRole = watch('role')
  const editRole = watchEdit('role')
  const loading = isLoading || isFetching

  useEffect(() => {
    if (!isError || skip) return
    if (error?.status === 403) toast.error('শুধু ওনার অ্যাক্সেস করতে পারবেন')
    else toast.error('অ্যাডমিন লোড ব্যর্থ')
  }, [isError, error, skip])

  const stats = useMemo(() => {
    const owners = admins.filter((a) => a.role === 'owner').length
    const staff = admins.filter((a) => a.role !== 'owner').length
    const inactive = admins.filter((a) => !a.isActive).length
    return { total: admins.length, owners, staff, inactive }
  }, [admins])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return admins.filter((a) => {
      if (filter === 'owner' && a.role !== 'owner') return false
      if (filter === 'staff' && a.role === 'owner') return false
      if (filter === 'inactive' && a.isActive) return false
      if (!q) return true
      return (
        String(a.name || '').toLowerCase().includes(q) ||
        String(a.phone || '').includes(q)
      )
    })
  }, [admins, filter, query])

  if (role && role !== 'owner') {
    return <Navigate to="/more" replace />
  }

  const onSubmit = async (values) => {
    try {
      const body = {
        name: values.name,
        phone: values.phone.replace(/[\s-]/g, ''),
        password: values.password,
        role: values.role,
      }
      if (values.role !== 'owner') {
        body.permissions = selectedPermissions(values)
      }
      await createAdmin(body).unwrap()
      toast.success('নতুন অ্যাডমিন তৈরি হয়েছে')
      setOpen(false)
      reset(emptyForm)
    } catch (err) {
      toast.error(err.data?.message || 'তৈরি ব্যর্থ')
    }
  }

  const openEdit = (admin) => {
    const set = new Set(admin.permissions || [])
    resetEdit({
      name: admin.name || '',
      phone: admin.phone || '',
      password: '',
      role: admin.role === 'owner' ? 'owner' : 'staff',
      permissions: Object.fromEntries(
        PERMISSION_OPTIONS.map((p) => [p.key, set.has(p.key)]),
      ),
    })
    setEditAdmin(admin)
  }

  const onEdit = async (values) => {
    try {
      const body = {
        id: editAdmin.id,
        name: values.name,
        phone: values.phone.replace(/[\s-]/g, ''),
        role: values.role,
      }
      if (values.password?.trim()) {
        body.password = values.password
      }
      if (values.role !== 'owner') {
        body.permissions = selectedPermissions(values)
      }
      await updateAdmin(body).unwrap()
      toast.success('অ্যাডমিন আপডেট হয়েছে')
      setEditAdmin(null)
    } catch (err) {
      toast.error(err.data?.message || 'আপডেট ব্যর্থ')
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    try {
      await deleteAdmin(pendingDelete.id).unwrap()
      toast.success(`${pendingDelete.name} মুছে ফেলা হয়েছে`)
      setPendingDelete(null)
    } catch (err) {
      toast.error(err.data?.message || 'ডিলিট ব্যর্থ')
    }
  }

  const toggle = async (admin) => {
    try {
      await setAdminActive({ id: admin.id, isActive: !admin.isActive }).unwrap()
      toast.success(admin.isActive ? 'ডিঅ্যাক্টিভেট হয়েছে' : 'অ্যাক্টিভ হয়েছে')
    } catch (err) {
      toast.error(err.data?.message || 'আপডেট ব্যর্থ')
    }
  }

  const FILTERS = [
    ['all', 'সব', stats.total],
    ['owner', 'Owner', stats.owners],
    ['staff', 'Staff', stats.staff],
    ['inactive', 'Inactive', stats.inactive],
  ]

  return (
    <div className="admins-page">
      <section className="admins-hero">
        <div className="admins-hero-copy">
          <div className="admins-hero-kicker">Team access</div>
          <h2 className="admins-hero-title">অ্যাডমিন ম্যানেজমেন্ট</h2>
          <p className="admins-hero-desc">
            স্টাফ অ্যাকাউন্ট তৈরি করুন এবং প্রতিটি কাজের অনুমতি আলাদা করে দিন
          </p>
        </div>
        <button
          className="btn-red admins-hero-cta"
          type="button"
          onClick={() => {
            reset(emptyForm)
            setOpen(true)
          }}
        >
          <Icon d="M12 5v14M5 12h14" />
          নতুন অ্যাডমিন
        </button>
      </section>

      <div className="admins-stats">
        <article className="admins-stat">
          <strong>{stats.total}</strong>
          <span>মোট</span>
        </article>
        <article className="admins-stat">
          <strong>{stats.owners}</strong>
          <span>Owner</span>
        </article>
        <article className="admins-stat">
          <strong>{stats.staff}</strong>
          <span>Staff</span>
        </article>
        <article className={`admins-stat${stats.inactive ? ' is-warn' : ''}`}>
          <strong>{stats.inactive}</strong>
          <span>Inactive</span>
        </article>
      </div>

      <div className="admins-toolbar">
        <label className="admins-search">
          <Icon d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16zM21 21l-4.3-4.3" />
          <input
            className="field"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="নাম বা ফোন খুঁজুন"
            aria-label="Search admins"
          />
        </label>
        <div className="admins-filters" role="tablist" aria-label="Filter admins">
          {FILTERS.map(([key, label, count]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={filter === key}
              className={`admins-filter${filter === key ? ' is-active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {label}
              <em>{count}</em>
            </button>
          ))}
        </div>
      </div>

      {loading && !admins.length && <p className="empty">লোড হচ্ছে…</p>}
      {!loading && !filtered.length && (
        <p className="empty">
          {admins.length ? 'কোনো ম্যাচ পাওয়া যায়নি' : 'এখনো কোনো অ্যাডমিন নেই'}
        </p>
      )}

      <div className="admins-grid">
        {filtered.map((a) => {
          const isSelf = a.id === selfId
          const isOwner = a.role === 'owner'
          return (
            <article
              className={`admin-card${isOwner ? ' is-owner' : ''}${!a.isActive ? ' is-inactive' : ''}`}
              key={a.id}
            >
              <div className="admin-card-head">
                <div className={`admin-avatar${isOwner ? ' is-owner' : ''}`} aria-hidden>
                  {initialOf(a.name)}
                </div>
                <div className="admin-card-main">
                  <div className="admin-card-title">
                    <h3>{a.name}</h3>
                    <div className="admin-badges">
                      <span className={`admin-badge${isOwner ? ' is-owner' : ''}`}>
                        {isOwner ? 'Owner' : 'Staff'}
                      </span>
                      {!a.isActive && <span className="admin-badge is-off">Inactive</span>}
                      {isSelf && <span className="admin-badge is-you">আপনি</span>}
                    </div>
                  </div>
                  <div className="admin-phone">{a.phone}</div>
                </div>
              </div>

              <div className="admin-card-body">
                {isOwner ? (
                  <p className="admin-full-access">সব অনুমতি · পূর্ণ অ্যাক্সেস</p>
                ) : (
                  <PermissionChips permissions={a.permissions} />
                )}
              </div>

              <div className="admin-card-actions">
                <button className="admin-action" type="button" onClick={() => openEdit(a)}>
                  <Icon d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                  এডিট
                </button>
                {!isSelf && (
                  <button
                    className={`admin-action${a.isActive ? ' is-danger' : ' is-ok'}`}
                    type="button"
                    onClick={() => toggle(a)}
                  >
                    <Icon d={a.isActive ? 'M18 6 6 18M6 6l12 12' : 'M5 12l4 4L19 6'} />
                    {a.isActive ? 'বন্ধ' : 'চালু'}
                  </button>
                )}
                {!isSelf && (
                  <button
                    className="admin-action is-danger"
                    type="button"
                    onClick={() => setPendingDelete(a)}
                  >
                    <Icon d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    মুছুন
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {open && (
        <Overlay onClose={() => setOpen(false)}>
          <form className="sheet admin-sheet" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit(onSubmit)}>
            <div className="handle" />
            <header className="admin-sheet-head">
              <h3>নতুন অ্যাডমিন</h3>
              <p>লগইন তথ্য দিন, তারপর স্টাফের অনুমতি বেছে নিন</p>
            </header>

            <div className="admin-form-grid">
              <div>
                <label className="lbl">নাম <i>*</i></label>
                <input className="field" {...register('name', { required: true })} placeholder="যেমন: করিম" />
              </div>
              <div>
                <label className="lbl">ফোন <i>*</i></label>
                <input className="field" inputMode="tel" {...register('phone', { required: true })} placeholder="01XXXXXXXXX" />
              </div>
              <div>
                <label className="lbl">পাসওয়ার্ড <i>*</i></label>
                <input className="field" type="password" {...register('password', { required: true, minLength: 6 })} placeholder="কমপক্ষে ৬ অক্ষর" />
              </div>
              <div>
                <label className="lbl">রোল</label>
                <select className="select" {...register('role')}>
                  <option value="staff">Staff</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
            </div>

            {createRole !== 'owner' ? (
              <section className="admin-perm-block">
                <div className="admin-perm-head">
                  <strong>অনুমতি</strong>
                  <span>কী কী করতে পারবে</span>
                </div>
                <PermissionChecklist register={register} watch={watch} />
              </section>
            ) : (
              <p className="admin-owner-note">Owner রোলে সব অনুমতি স্বয়ংক্রিয়ভাবে থাকবে</p>
            )}

            <button className="btn-red block" type="submit" disabled={creating}>
              তৈরি করুন
            </button>
          </form>
        </Overlay>
      )}

      {editAdmin && (
        <Overlay onClose={() => setEditAdmin(null)}>
          <form
            className="sheet admin-sheet"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleEditSubmit(onEdit)}
          >
            <div className="handle" />
            <header className="admin-sheet-head">
              <h3>অ্যাডমিন এডিট</h3>
              <p>{editAdmin.name} · তথ্য ও অনুমতি আপডেট করুন</p>
            </header>

            <div className="admin-form-grid">
              <div>
                <label className="lbl">নাম <i>*</i></label>
                <input className="field" {...registerEdit('name', { required: true })} />
              </div>
              <div>
                <label className="lbl">ফোন <i>*</i></label>
                <input className="field" inputMode="tel" {...registerEdit('phone', { required: true })} />
              </div>
              <div>
                <label className="lbl">নতুন পাসওয়ার্ড</label>
                <input
                  className="field"
                  type="password"
                  {...registerEdit('password', { minLength: 6 })}
                  placeholder="খালি রাখলে আগেরটা থাকবে"
                />
              </div>
              <div>
                <label className="lbl">রোল</label>
                <select className="select" {...registerEdit('role')}>
                  <option value="staff">Staff</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
            </div>

            {editRole !== 'owner' ? (
              <section className="admin-perm-block">
                <div className="admin-perm-head">
                  <strong>অনুমতি</strong>
                  <span>কী কী করতে পারবে</span>
                </div>
                <PermissionChecklist register={registerEdit} watch={watchEdit} />
              </section>
            ) : (
              <p className="admin-owner-note">Owner রোলে সব অনুমতি স্বয়ংক্রিয়ভাবে থাকবে</p>
            )}

            <button className="btn-red block" type="submit" disabled={updating}>
              সেভ করুন
            </button>
          </form>
        </Overlay>
      )}

      {pendingDelete && (
        <Overlay onClose={() => !deleting && setPendingDelete(null)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>মুছে ফেলবেন?</h3>
            <p>
              <strong>{pendingDelete.name}</strong> ({pendingDelete.phone})-কে মুছে ফেলবেন?
              এটা ফেরানো যাবে না।
            </p>
            <div className="actions">
              <button
                className="btn-ghost"
                type="button"
                disabled={deleting}
                onClick={() => setPendingDelete(null)}
              >
                না
              </button>
              <button className="btn-danger" type="button" disabled={deleting} onClick={confirmDelete}>
                {deleting ? 'মুছছে…' : 'হ্যাঁ, মুছুন'}
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  )
}
