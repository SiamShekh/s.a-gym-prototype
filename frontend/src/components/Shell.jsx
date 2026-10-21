import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { fetchMembers } from '../store/membersSlice'
import MemberFormSheet from './MemberFormSheet'
import ThemeToggle from './ThemeToggle'

const titles = {
  '/': 'Dashboard',
  '/members': 'Member',
  '/billing': 'Billing',
  '/notifications': 'Notifications',
  '/payment': 'Payment',
  '/more': 'More',
}

function Icon({ d }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Shell() {
  const token = useSelector((s) => s.auth.token)
  const status = useSelector((s) => s.members.status)
  const dispatch = useDispatch()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!token) return
    dispatch(fetchMembers())
      .unwrap()
      .catch(() => toast.error('ডেটা লোড ব্যর্থ'))
  }, [token, dispatch])

  if (!token) return <Navigate to="/login" replace />

  const links = [
    ['/', 'Dashboard', 'M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z', true],
    ['/members', 'Member', 'M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM20 19v-1a3.5 3.5 0 0 0-2.5-3.35M16.5 4.13a3.5 3.5 0 0 1 0 6.74', false],
    ['/billing', 'Billing', 'M4 6h16M4 12h16M4 18h10', false],
    ['/notifications', 'Notifications', 'M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9M10 21h4', false],
    ['/payment', 'Payment', 'M4 8h16v10H4zM4 12h16', false],
    ['/more', 'More', 'M5 7h14M5 12h14M5 17h14', false],
  ]

  return (
    <div className="shell">
      <nav className="side-nav bg-base-100 text-base-content">
        <div className="side-brand">
          <img src="/sa_gym_logo.png" alt="" />
          S.A GYM
        </div>
        {links.map(([to, label, d, end]) => (
          <NavLink key={to} to={to} end={end}>
            <Icon d={d} />
            {label}
          </NavLink>
        ))}
        <div className="side-theme">
          <span>Theme</span>
          <ThemeToggle />
        </div>
      </nav>
      <div className="shell-main bg-base-100 text-base-content">
        <header className="topbar bg-base-100">
          <img src="/sa_gym_logo.png" alt="" />
          <h1 className="text-base-content">{titles[pathname] || 'Dashboard'}</h1>
          <ThemeToggle />
          <button className="btn-red bg-primary text-primary-content" type="button" onClick={() => setOpen(true)}>
            নতুন সদস্য
          </button>
        </header>
        <div className="hairline" />
        <main className="page">
          {status === 'loading' && <p className="light">লোড হচ্ছে…</p>}
          <Outlet />
        </main>
        <div className="hairline" />
        <nav className="bottom-nav">
          <NavLink to="/" end>
            <Icon d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
            Dashboard
          </NavLink>
          <NavLink to="/members">
            <Icon d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM20 19v-1a3.5 3.5 0 0 0-2.5-3.35M16.5 4.13a3.5 3.5 0 0 1 0 6.74" />
            Member
          </NavLink>
          <NavLink to="/more">
            <Icon d="M5 7h14M5 12h14M5 17h14" />
            More
          </NavLink>
        </nav>
      </div>
      {open && <MemberFormSheet onClose={() => setOpen(false)} />}
    </div>
  )
}
