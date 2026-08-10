import { useState, useEffect } from 'react'

// Generalizes the "call an async function on mount, track loading/error/data"
// pattern we wrote by hand in Employees.jsx during Phase 5. Any page that
// needs to fetch something reuses this instead of repeating that
// try/catch/finally boilerplate every time.
export function useFetch(fetchFn, deps = []) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isCancelled = false

    async function run() {
      try {
        setIsLoading(true)
        const result = await fetchFn()
        if (!isCancelled) {
          setData(result)
          setError(null)
        }
      } catch (err) {
        if (!isCancelled) setError(err)
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }

    run()

    // Cleanup: if deps change (a new fetch starts) or the component
    // unmounts before this one resolves, ignore its result — prevents a
    // slow, stale request from overwriting a newer one's data.
    return () => {
      isCancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, isLoading, error }
}