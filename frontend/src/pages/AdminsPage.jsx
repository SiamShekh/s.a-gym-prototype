import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { api } from '../api/client'
import Overlay from '../components/Overlay'

export default function AdminsPage() {
  const token = useSelector((s) => s.auth.token)
  const role = useSelector((s) => s.auth.adminRole)
  const selfId = useSelector((s) => s.auth.adminId)
  const [admins, setAdmins] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: { name: '', phone: '', password: '', role: 'staff' },
  })

  const load = async () => {
    setLoading(true)
    try {
      const data = await api('/admins', { token })
      setAdmins(data.admins || [])
    } catch (err) {
      if (err.status === 403) toast.error('শুধু ওনার অ্যাক্সেস করতে পারবেন')
      else toast.error('অ্যাডমিন লোড ব্যর্থ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (role === 'owner') load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, role])

  if (role && role !== 'owner') {
    return <Navigate to="/more" replace />
  }

  const onSubmit = async (values) => {
    try {
      await api('/admins', {
        method: 'POST',
        token,
        body: {
          name: values.name,
          phone: values.phone.replace(/[\s-]/g, ''),
          password: values.password,
          role: values.role,
        },
      })
      toast.success('নতুন অ্যাডমিন তৈরি হয়েছে')
      setOpen(false)
      reset({ name: '', phone: '', password: '', role: 'staff' })
      await load()
    } catch (err) {
      toast.error(err.data?.message || 'তৈরি ব্যর্থ')
    }
  }

  const toggle = async (admin) => {
    try {
      await api(`/admins/${admin.id}/active`, {
        method: 'PATCH',
        token,
        body: { isActive: !admin.isActive },
      })
      toast.success(admin.isActive ? 'ডিঅ্যাক্টিভেট হয়েছে' : 'অ্যাক্টিভ হয়েছে')
      await load()
    } catch (err) {
      toast.error(err.data?.message || 'আপডেট ব্যর্থ')
    }
  }

  return (
    <div className="stack">
      <section className="actions-hero">
        <div>
          <div className="actions-hero-kicker">Team</div>
          <h2 className="actions-hero-title">অ্যাডমিন ম্যানেজমেন্ট</h2>
          <p className="light" style={{ margin: '6px 0 0', fontSize: 13 }}>
            ওনার নতুন স্টাফ/অ্যাডমিন তৈরি করতে পারেন
          </p>
        </div>
        <div className="actions-hero-stat">
          <strong>{admins.length}</strong>
          <span>মোট অ্যাকাউন্ট</span>
        </div>
      </section>

      <button className="btn-red block" type="button" onClick={() => setOpen(true)}>
        নতুন অ্যাডমিন
      </button>

      {loading && !admins.length && <p className="empty">লোড হচ্ছে…</p>}

      <div className="card-grid">
        {admins.map((a) => (
          <article className="card row bg-base-100" key={a.id}>
            <div className="grow">
              <div className="name" style={{ fontSize: 14 }}>{a.name}</div>
              <div className="phone">
                {a.phone} · {a.role === 'owner' ? 'Owner' : 'Staff'}
                {!a.isActive ? ' · Inactive' : ''}
                {a.id === selfId ? ' · আপনি' : ''}
              </div>
            </div>
            {a.id !== selfId && (
              <button
                className={a.isActive ? 'btn-danger' : 'btn-ghost'}
                type="button"
                onClick={() => toggle(a)}
              >
                {a.isActive ? 'বন্ধ' : 'চালু'}
              </button>
            )}
          </article>
        ))}
      </div>

      {open && (
        <Overlay onClose={() => setOpen(false)}>
          <form className="sheet" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit(onSubmit)}>
            <div className="handle" />
            <h3 style={{ margin: '0 0 8px' }}>নতুন অ্যাডমিন</h3>

            <label className="lbl">নাম <i>*</i></label>
            <input className="field" {...register('name', { required: true })} />

            <label className="lbl">ফোন <i>*</i></label>
            <input className="field" inputMode="tel" {...register('phone', { required: true })} />

            <label className="lbl">পাসওয়ার্ড <i>*</i></label>
            <input className="field" type="password" {...register('password', { required: true, minLength: 6 })} />

            <label className="lbl">রোল</label>
            <select className="select" {...register('role')}>
              <option value="staff">Staff</option>
              <option value="owner">Owner</option>
            </select>

            <button className="btn-red block" type="submit" disabled={isSubmitting} style={{ marginTop: 16 }}>
              তৈরি করুন
            </button>
          </form>
        </Overlay>
      )}
    </div>
  )
}
