import { useState, useEffect, useRef, useCallback } from 'react'
import { FiClock } from 'react-icons/fi'
import Card from '../ui/Card'
import { getOnShiftNow } from '../../services/scheduleService'

const POLL_MS = 15000

// Who's clocked in right now. Refreshes itself on an interval so the
// panel stays live without Priya reloading the page.
function OnShiftPanel({ department, refreshToken }) {
  const [people, setPeople] = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)

  // A poll in flight when the panel unmounts would resolve into a
  // component that no longer exists. The flag makes that response a
  // no-op instead of a wasted state update.
  const isMounted = useRef(true)
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const refresh = useCallback(() => {
    getOnShiftNow().then((list) => {
      if (!isMounted.current) return
      setPeople(list)
      setLastUpdated(new Date())
    })
  }, [])

  // The polling timer. Created ONCE (its only dependency is a useCallback
  // with an empty dep list, so it never changes) and — the part that was
  // missing — cleared in the cleanup function.
  //
  // Two things go wrong without that cleanup:
  //   1. every re-run of the effect starts an ADDITIONAL interval while
  //      the previous one keeps running, so ticks pile up: 1/tick, then
  //      2, then 3…
  //   2. leaving /schedule doesn't stop any of them — the component is
  //      gone but its timers keep firing forever.
  // React calls this cleanup both before re-running the effect and on
  // unmount, which covers both cases with one line.
  useEffect(() => {
    const timerId = setInterval(refresh, POLL_MS)
    return () => clearInterval(timerId)
  }, [refresh])

  // Refresh immediately on mount, and again whenever the roster changes,
  // so a shift you just assigned for today shows up without waiting out
  // the interval. Note this is a SEPARATE effect: a one-off fetch and a
  // recurring timer are different concerns, and merging them is what made
  // the timer restart on every unrelated change.
  useEffect(() => {
    refresh()
  }, [refresh, refreshToken])

  // `department` is deliberately NOT an effect dependency. Filtering is a
  // rendering concern, not a fetching one — the server returns everyone
  // on shift, and narrowing the list is cheap local work. Making it a
  // dependency is what dragged filter changes into the timer's lifecycle
  // in the first place.
  const visible = department === 'All' ? people : people.filter((p) => p.department === department)

  return (
    <Card className="w-full shrink-0 xl:w-64">
      <div className="mb-3 flex items-center gap-2">
        <FiClock className="text-primary" size={16} />
        <h3 className="font-semibold text-gray-800 dark:text-gray-100">Currently on shift</h3>
      </div>

      <p className="mb-3 text-xs text-gray-400">
        {visible.length} on duty
        {lastUpdated && ` · updated ${lastUpdated.toLocaleTimeString()}`}
      </p>

      <ul className="max-h-[calc(100dvh-27rem)] space-y-1 overflow-auto text-sm">
        {visible.length === 0 && <li className="text-gray-400">Nobody is on shift right now.</li>}
        {visible.slice(0, 50).map((person) => (
          <li key={person.id} className="flex justify-between gap-2">
            <span className="truncate text-gray-700 dark:text-gray-200">{person.name}</span>
            <span className="shrink-0 text-[10px] text-gray-400">{person.department}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export default OnShiftPanel
