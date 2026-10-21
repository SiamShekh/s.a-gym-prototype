import { useEffect, useState } from 'react'
import { Provider } from 'react-redux'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { store } from './store/store'
import Shell from './components/Shell'
import LoginPage from './pages/LoginPage'
import OverviewPage from './pages/OverviewPage'
import MembersPage from './pages/MembersPage'
import BillingPage from './pages/BillingPage'
import NotificationsPage from './pages/NotificationsPage'
import PaymentPage from './pages/PaymentPage'
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
              <Route path="billing" element={<BillingPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="payment" element={<PaymentPage />} />
              <Route path="more" element={<MorePage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
      <AppToaster />
    </Provider>
  )
}
