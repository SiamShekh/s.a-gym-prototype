import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import MemberFormSheet from './MemberFormSheet'
import ProfileSheet from './ProfileSheet'
import ThemeToggle from './ThemeToggle'
import { logout } from '../store/authSlice'
import { hasPermission } from '../lib/permissions'

const titles = {
  '/': 'Dashboard',
  '/members': 'Member',
  '/due': 'Due',
  '/payments': 'Payments',
  '/expenses': 'Expenses',
  '/notifications': 'Notifications',
  '/actions': 'Actions',
  '/admins': 'Admins',
  '/more': 'More',
}

const LINKS = [
  ['/', 'Dashboard', 'M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z', true, 'view_reports'],
  ['/members', 'Members', 'M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM20 19v-1a3.5 3.5 0 0 0-2.5-3.35M16.5 4.13a3.5 3.5 0 0 1 0 6.74', false, 'view_members'],
  ['/due', 'Due', 'M10.3 4.3 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01', false, 'view_members'],
  ['/payments', 'Payments', 'M4 8h16v10H4zM4 12h16', false, 'view_payments'],
  ['/expenses', 'Expenses', 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6', false, 'manage_expenses'],
  ['/notifications', 'Notifications', 'M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9M10 21h4', false, 'send_notifications'],
  ['/actions', 'Actions', 'M12 8v4l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', false, 'view_actions'],
]

function Icon({ d }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Shell() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const token = useSelector((s) => s.auth.token)
  const adminRole = useSelector((s) => s.auth.adminRole)
  const permissions = useSelector((s) => s.auth.permissions)
  const isOwner = adminRole === 'owner'
  const can = (key) => hasPermission(adminRole, permissions, key)
  const { pathname } = useLocation()
  const [memberOpen, setMemberOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  if (!token) return <Navigate to="/login" replace />

  return (
    <div className="shell">
      <nav className="side-nav bg-base-100 text-base-content" aria-label="Desktop">
        <div className="side-brand">
          <img src="/sa_gym_logo.png" alt="" />
          S.A GYM
        </div>

        <div className="side-scroll">
          {LINKS.filter(([, , , , perm]) => can(perm)).map(([to, label, icon, end]) => (
            <NavLink key={to} to={to} end={end} className="side-link">
              <Icon d={icon} />
              <span>{label}</span>
            </NavLink>
          ))}
          {isOwner && (
            <NavLink to="/admins" className="side-link">
              <Icon d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8v6M22 11h-6" />
              <span>Admins</span>
            </NavLink>
          )}

          <div className="side-divider" />

          <button type="button" className="side-link side-link-btn" onClick={() => setProfileOpen(true)}>
            <Icon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
            <span>Profile</span>
          </button>
          <button
            type="button"
            className="side-link side-link-btn is-danger"
            onClick={() => {
              dispatch(logout())
              navigate('/login', { replace: true })
            }}
          >
            <Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            <span>Logout</span>
          </button>
        </div>

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
          {can('create_members') &&
            (pathname === '/' || pathname === '/members' || pathname === '/due') && (
            <button
              className="btn-red topbar-cta bg-primary text-primary-content"
              type="button"
              onClick={() => setMemberOpen(true)}
            >
              নতুন সদস্য
            </button>
          )}
        </header>
        <div className="hairline" />
        <main className="page">
          <Outlet />
        </main>
        <div className="hairline" />
        <nav className="bottom-nav" aria-label="Mobile">
          {can('view_reports') && (
            <NavLink to="/" end>
              <Icon d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
              Dashboard
            </NavLink>
          )}
          {can('view_members') && (
            <NavLink to="/members">
              <Icon d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM20 19v-1a3.5 3.5 0 0 0-2.5-3.35M16.5 4.13a3.5 3.5 0 0 1 0 6.74" />
              Member
            </NavLink>
          )}
          <NavLink to="/more">
            <Icon d="M5 7h14M5 12h14M5 17h14" />
            More
          </NavLink>
        </nav>
      </div>

      {memberOpen && <MemberFormSheet onClose={() => setMemberOpen(false)} />}
      {profileOpen && <ProfileSheet onClose={() => setProfileOpen(false)} />}
    </div>
  )
}
