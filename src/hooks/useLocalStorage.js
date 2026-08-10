import { useState } from 'react'

// Generic localStorage-backed state — same [value, setValue] shape as
// useState, but the value survives a page refresh. Any hook/component
// needing "persisted state" reuses this instead of repeating the
// localStorage.getItem/setItem dance (ThemeContext used to do this by hand).
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored !== null ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  function set(newValue) {
    setValue((prev) => {
      const resolved = newValue instanceof Function ? newValue(prev) : newValue
      localStorage.setItem(key, JSON.stringify(resolved))
      return resolved
    })
  }

  return [value, set]
}