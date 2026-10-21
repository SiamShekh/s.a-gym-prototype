import { useEffect, useState } from 'react'
import { applyTheme, getStoredTheme } from '../lib/theme'

const THEME_EVENT = 'sa-theme-change'

export default function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useState(() => getStoredTheme())

  useEffect(() => {
    const sync = () => setTheme(getStoredTheme())
    window.addEventListener('storage', sync)
    window.addEventListener(THEME_EVENT, sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(THEME_EVENT, sync)
    }
  }, [])

  const isLight = theme === 'light'

  const toggle = (checked) => {
    const next = applyTheme(checked ? 'light' : 'dark')
    setTheme(next)
    window.dispatchEvent(new Event(THEME_EVENT))
  }

  return (
    <label
      className={`theme-toggle swap swap-rotate ${className}`.trim()}
      title={isLight ? 'Dark mode' : 'Light mode'}
      aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
    >
      <input
        type="checkbox"
        className="theme-controller"
        value="light"
        checked={isLight}
        onChange={(e) => toggle(e.target.checked)}
      />
      <svg className="swap-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" strokeLinecap="round" />
        <circle cx="12" cy="12" r="4" />
      </svg>
      <svg className="swap-on" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </label>
  )
}
