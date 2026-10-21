import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import ProfileSheet from '../components/ProfileSheet'
import { logout } from '../store/authSlice'
import { hasPermission } from '../lib/permissions'

function Icon({ d }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const OPS = [
  ['/members', 'সদস্য', 'খুঁজুন, এডিট ও পেমেন্ট', 'M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM20 19v-1a3.5 3.5 0 0 0-2.5-3.35M16.5 4.13a3.5 3.5 0 0 1 0 6.74', 'view_members'],
  ['/due', 'বকেয়া', 'পেমেন্ট বাকি সদস্য', 'M10.3 4.3 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01', 'view_members'],
  ['/payments', 'পেমেন্ট', 'সব পেমেন্ট হিস্টোরি', 'M4 8h16v10H4zM4 12h16', 'view_payments'],
  ['/expenses', 'খরচ', 'ভাড়া, বেতন ও অন্যান্য', 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6', 'manage_expenses'],
  ['/notifications', 'নোটিফিকেশন', 'মেয়াদ সতর্কতা পাঠান', 'M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9M10 21h4', 'send_notifications'],
  ['/actions', 'অ্যাকশন লগ', 'আপনার কাজের হিসাব', 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8', 'view_actions'],
]

function initialOf(name) {
  const t = String(name || 'A').trim()
  return t ? t[0].toUpperCase() : 'A'
}

export default function MorePage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const adminName = useSelector((s) => s.auth.adminName)
  const adminRole = useSelector((s) => s.auth.adminRole)
  const permissions = useSelector((s) => s.auth.permissions)
  const isOwner = adminRole === 'owner'
  const can = (key) => hasPermission(adminRole, permissions, key)
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <div className="more-page">
      <section className="more-profile">
        <div className="more-profile-main">
          <div className="more-avatar" aria-hidden>{initialOf(adminName)}</div>
          <div className="more-profile-text">
            <div className="more-profile-name">{adminName || 'Admin'}</div>
            <div className="more-profile-meta">
              <span className={`more-role${isOwner ? ' is-owner' : ''}`}>
                {isOwner ? 'Owner' : 'Staff'}
              </span>
              <span className="more-dot" aria-hidden />
              <span>S.A Gym</span>
            </div>
          </div>
        </div>
        <button className="more-profile-edit" type="button" onClick={() => setProfileOpen(true)}>
          এডিট
        </button>
      </section>

      <section className="more-panel">
        <div className="more-panel-head">মেনু</div>
        <div className="more-menu">
          {OPS.filter(([, , , , perm]) => can(perm)).map(([to, title, desc, icon]) => (
            <Link key={to} to={to} className="more-item">
              <span className="more-item-icon">
                <Icon d={icon} />
              </span>
              <span className="more-item-body">
                <strong>{title}</strong>
                <span>{desc}</span>
              </span>
              <span className="more-item-chevron" aria-hidden>
                <Icon d="M9 6l6 6-6 6" />
              </span>
            </Link>
          ))}
          {isOwner && (
            <Link to="/admins" className="more-item">
              <span className="more-item-icon tone">
                <Icon d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8v6M22 11h-6" />
              </span>
              <span className="more-item-body">
                <strong>অ্যাডমিন</strong>
                <span>স্টাফ অ্যাকাউন্ট তৈরি ও নিয়ন্ত্রণ</span>
              </span>
              <span className="more-item-chevron" aria-hidden>
                <Icon d="M9 6l6 6-6 6" />
              </span>
            </Link>
          )}
        </div>
      </section>

      <section className="more-panel">
        <div className="more-panel-head">সেটিংস</div>
        <div className="more-menu">
          <button type="button" className="more-item" onClick={() => setProfileOpen(true)}>
            <span className="more-item-icon tone">
              <Icon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
            </span>
            <span className="more-item-body">
              <strong>প্রোফাইল / পাসওয়ার্ড</strong>
              <span>নাম ও পাসওয়ার্ড আপডেট</span>
            </span>
            <span className="more-item-chevron" aria-hidden>
              <Icon d="M9 6l6 6-6 6" />
            </span>
          </button>
          <div className="more-item is-static">
            <span className="more-item-icon">
              <Icon d="M12 3v2M12 19v2M5 12H3M21 12h-2M6.3 6.3 4.9 4.9M19.1 19.1l-1.4-1.4M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
            </span>
            <span className="more-item-body">
              <strong>থিম</strong>
              <span>লাইট / ডার্ক মোড</span>
            </span>
            <ThemeToggle />
          </div>
        </div>
      </section>

      <button
        className="more-logout"
        type="button"
        onClick={() => {
          dispatch(logout())
          navigate('/login', { replace: true })
        }}
      >
        লগআউট
      </button>

      <p className="more-footnote">S.A Gym Management · v1.1</p>
      {profileOpen && <ProfileSheet onClose={() => setProfileOpen(false)} />}
    </div>
  )
}
