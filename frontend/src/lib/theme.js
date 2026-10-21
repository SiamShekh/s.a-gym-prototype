export const THEME_KEY = 'sa-theme'
export const THEMES = ['dark', 'light']

export function getStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* ignore */
  }
  return 'dark'
}

export function applyTheme(theme) {
  const next = theme === 'light' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', next)
  document.documentElement.style.colorScheme = next
  try {
    localStorage.setItem(THEME_KEY, next)
  } catch {
    /* ignore */
  }
  return next
}
