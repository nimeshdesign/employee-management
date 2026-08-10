import { useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'

function getSystemPreference() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Encapsulates "what theme is active + how to change it + keep <html> in
// sync" as one reusable unit built on useLocalStorage. ThemeContext (below)
// becomes a thin wrapper that makes ONE instance of this hook's state
// available globally via Context — the hook holds the logic, Context
// just decides how many "copies" of that state exist (one, shared).
export function useDarkMode() {
  const [theme, setTheme] = useLocalStorage('theme', getSystemPreference())

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return { theme, toggleTheme }
}