import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { GYM_PHONE, daysLeft, planLabel, whatsappUrl } from '../lib/memberUtils'
import { requestPay } from '../store/membersSlice'

function messageFor(member) {
  const d = daysLeft(member.expiry)
  if (d < 0) return `আপনার S.A Gym সদস্যপদের মেয়াদ শেষ হয়ে গেছে। রিনিউ করতে কল করুন: ${GYM_PHONE}`
  return `আপনার S.A Gym সদস্যপদের মেয়াদ ${d} দিনের মধ্যে শেষ হবে। রিনিউ করুন: ${GYM_PHONE}`
}

export default function NotificationsPage() {
  const members = useSelector((s) => s.members.list)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const sections = [
    ['● আজই শেষ (জরুরি)', members.filter((m) => daysLeft(m.expiry) >= 0 && daysLeft(m.expiry) <= 1), 'tone-primary'],
    ['● ২-৩ দিন বাকি', members.filter((m) => { const d = daysLeft(m.expiry); return d >= 2 && d <= 3 }), 'tone-content'],
    ['● ৪-৭ দিন বাকি', members.filter((m) => { const d = daysLeft(m.expiry); return d >= 4 && d <= 7 }), 'tone-muted'],
    ['● মেয়াদ শেষ — রিনিউ করুন', members.filter((m) => daysLeft(m.expiry) < 0), 'tone-primary'],
  ]
  const any = sections.some(([, list]) => list.length)

  const notify = (member) => {
    window.open(whatsappUrl(member.phone, messageFor(member)), '_blank', 'noopener')
    toast.success(`${member.name}-কে WhatsApp নোটিফিকেশন পাঠানো হয়েছে`)
  }

  const notifyAll = () => {
    const list = members.filter((m) => daysLeft(m.expiry) <= 7)
    if (!list.length) {
      toast('সবার সদস্যপদ ঠিক আছে!')
      return
    }
    list.forEach(notify)
    toast.success(`${list.length} জনকে WhatsApp নোটিফিকেশন পাঠানো হচ্ছে`)
  }

  return (
    <div className="stack">
      <section className="banner">
        <strong>সাবস্ক্রিপশন মেয়াদ সতর্কতা</strong>
        <p className="light" style={{ margin: '4px 0 12px', fontSize: 12 }}>
          যাদের মেয়াদ শেষ হতে চলেছে তাদের নোটিফাই করুন
        </p>
        <button className="btn-red" type="button" onClick={notifyAll}>সবাইকে নোটিফাই</button>
      </section>
      {!any && <p className="empty">সবার সাবস্ক্রিপশন ঠিক আছে!</p>}
      {sections.map(([title, list, color]) =>
        list.length ? (
          <section key={title}>
            <div className="section-label">{title}</div>
            <div className="card-grid">
            {list.map((m) => {
              const d = daysLeft(m.expiry)
              return (
                <article className="card member" key={m.id}>
                  <div className="name">{m.name}</div>
                  <div className="phone">{m.phone} · {planLabel(m.plan)}</div>
                  <div className={color} style={{ fontWeight: 700, fontSize: 13, marginTop: 8 }}>
                    {d < 0 ? 'মেয়াদ শেষ হয়ে গেছে!' : `${d} দিন বাকি`}
                  </div>
                  <div className="actions">
                    <button className="btn-ghost" type="button" onClick={() => notify(m)}>Notify</button>
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
                </article>
              )
            })}
            </div>
          </section>
        ) : null,
      )}
    </div>
  )
}
