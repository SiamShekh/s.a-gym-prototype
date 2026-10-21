import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import { logout } from '../store/authSlice'

const LINKS = [
  ['/billing', 'Billing', 'পেমেন্ট ও বিল স্ট্যাটাস'],
  ['/notifications', 'Notifications', 'মেয়াদ শেষ হওয়ার অ্যালার্ট'],
  ['/payment', 'Payment', 'নতুন পেমেন্ট গ্রহণ'],
]

export default function MorePage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  return (
    <div className="stack">
      <div className="more-header">
        <img src="/sa_gym_logo.png" alt="" />
        <div>
          <div className="brand">S.A GYM</div>
          <div className="light" style={{ fontSize: 12, marginTop: 2 }}>ম্যানেজমেন্ট সিস্টেম</div>
        </div>
      </div>
      <div className="card row bg-base-100 text-base-content">
        <div className="grow">
          <div className="name" style={{ fontSize: 13 }}>Sohag Biswas</div>
          <div className="phone">Owner / Admin</div>
        </div>
      </div>
      <div className="card row bg-base-100 text-base-content">
        <div className="grow">
          <div className="name" style={{ fontSize: 13 }}>Theme</div>
          <div className="phone">Light / Dark</div>
        </div>
        <ThemeToggle />
      </div>
      <div>
        <div className="section-label">Quick links</div>
        <div className="link-list">
        {LINKS.map(([to, title, desc]) => (
          <Link key={to} to={to} className="card link-card">
            <strong>{title}</strong>
            <span>{desc}</span>
          </Link>
        ))}
        </div>
      </div>
      <button
        className="btn-danger block"
        type="button"
        style={{ padding: 14, fontSize: 14 }}
        onClick={() => {
          dispatch(logout())
          navigate('/login', { replace: true })
        }}
      >
        লগআউট
      </button>
    </div>
  )
}
