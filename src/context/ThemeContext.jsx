import { createContext, useContext } from 'react'
import { useDarkMode } from '../hooks/useDarkMode'

const ThemeContext = createContext(null)

// All the actual logic (state, localStorage, DOM sync) now lives in
// useDarkMode. This component's only job is making that one instance of
// it reachable from anywhere via Context, instead of every component that
// calls useDarkMode() getting its own independent, out-of-sync copy.
export function ThemeProvider({ children }) {
  const theme = useDarkMode()
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}