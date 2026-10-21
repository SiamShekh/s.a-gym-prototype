import { useEffect, useState } from 'react'
import { Provider } from 'react-redux'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { store } from './store/store'
import Shell from './components/Shell'
import LoginPage from './pages/LoginPage'
import OverviewPage from './pages/OverviewPage'
import MembersPage from './pages/MembersPage'
import NotificationsPage from './pages/NotificationsPage'
import ActionsPage from './pages/ActionsPage'
import PaymentsPage from './pages/PaymentsPage'
import DuePage from './pages/DuePage'
import ExpensesPage from './pages/ExpensesPage'
import AdminsPage from './pages/AdminsPage'
import MorePage from './pages/MorePage'
import { getStoredTheme } from './lib/theme'

function AppToaster() {
  const [theme, setTheme] = useState(() => getStoredTheme())

  useEffect(() => {
    const sync = () => setTheme(getStoredTheme())
    window.addEventListener('storage', sync)
    const observer = new MutationObserver(sync)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => {
      window.removeEventListener('storage', sync)
      observer.disconnect()
    }
  }, [])

  return <Toaster theme={theme} position="top-center" />
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <div className="app-stage bg-base-100 text-base-content">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<Shell />}>
              <Route index element={<OverviewPage />} />
              <Route path="members" element={<MembersPage />} />
              <Route path="due" element={<DuePage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="expenses" element={<ExpensesPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="actions" element={<ActionsPage />} />
              <Route path="admins" element={<AdminsPage />} />
              <Route path="more" element={<MorePage />} />
              <Route path="billing" element={<Navigate to="/payments" replace />} />
              <Route path="payment" element={<Navigate to="/members" replace />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
      <AppToaster />
    </Provider>
  )
}
