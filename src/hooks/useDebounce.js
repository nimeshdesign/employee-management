import { useState, useEffect } from 'react'

// Delays updating the returned value until `delay` ms have passed without
// `value` changing again. Typing "react" fires 5 keystrokes, but the
// debounced value only updates once, 300ms after the last one — useful
// for search boxes so you're not re-filtering (or, later, re-fetching)
// on every single keystroke.
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)

    // Cleanup: if `value` changes again before the timer fires (user kept
    // typing), cancel the stale timeout. This is what makes it a debounce
    // instead of a fixed delay.
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}