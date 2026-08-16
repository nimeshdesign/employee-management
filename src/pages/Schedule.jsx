import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FiRotateCcw } from 'react-icons/fi'
import Loader from '../components/ui/Loader'
import Button from '../components/ui/Button'
import RosterGrid from '../components/schedule/RosterGrid'
import ShiftPalette from '../components/schedule/ShiftPalette'
import { DRAG_SHIFT, DRAG_CELL, CONTROL_CLASS } from '../components/schedule/shiftStyles'
import ScheduleToolbar from '../components/schedule/ScheduleToolbar'
import OnShiftPanel from '../components/schedule/OnShiftPanel'
import {
  getScheduleData,
  getDateRange,
  assignShift,
  unassignShift,
  moveShift,
  parseKey,
  makeKey,
  toDateKey,
  fromDateKey,
  addDays,
} from '../services/scheduleService'
import { detectConflicts, summarizeConflicts, DEFAULT_MIN_STAFFING } from '../utils/conflicts'
import { useDebounce } from '../hooks/useDebounce'

function Schedule() {
  // Milestone 1 keeps roster state local to the page. The whole roster
  // arrives in ONE getScheduleData() call — employees and assignments
  // together — so a single fetch here is all the grid ever needs.
  const [employees, setEmployees] = useState([])
  const [assignments, setAssignments] = useState({})
  const [isLoading, setIsLoading] = useState(true)

  // Change history for Undo. Each entry remembers what the affected
  // cells held BEFORE the change, so undo = "put those values back".
  //   { cells: { [key]: previousShiftOrUndefined } }
  const [history, setHistory] = useState([])

  // Configurable minimum headcount per department+shift+day.
  const [minStaffing, setMinStaffing] = useState(DEFAULT_MIN_STAFFING)

  // ── Filters + week: the URL IS the state ───────────────────────────
  // These are DERIVED from the query string on every render, not copied
  // into useState. There is therefore exactly one source of truth, and no
  // sync effect to get out of step.
  //
  // The earlier version seeded local state from the URL once and pushed
  // changes back with an effect. That reads fine but forks the truth:
  // useState's initial value is only ever read on the FIRST render, so
  // anything that changes the URL afterwards — the Back button, a shared
  // link opened in place, a redirect, a background refresh — leaves the
  // URL saying one week and the grid showing another, with no code path
  // that reconciles them.
  //
  // Deciding what goes where:
  //   URL       — filters, search, selected week: a colleague opening the
  //               link should see exactly this view (the task's step 8)
  //   component — minStaffing, drag state, loading: view-local, nobody
  //               needs to reproduce them from a link
  //   service   — assignments: the actual domain data, owned by the
  //               "server" and persisted there
  const [searchParams, setSearchParams] = useSearchParams()
  const today = toDateKey(new Date())

  const searchTerm = searchParams.get('q') || ''
  const department = searchParams.get('dept') || 'All'
  const shiftFilter = searchParams.get('shift') || 'All'
  const startDate = searchParams.get('start') || today

  // One writer for all four. Values equal to their default are removed
  // rather than written, so the default view has a clean URL.
  const setParam = useCallback(
    (key, value, defaultValue) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (!value || value === defaultValue) next.delete(key)
          else next.set(key, value)
          return next
        },
        // replace: true — filter tweaks shouldn't pile up in Back-button
        // history, but a deliberate change still updates the current entry
        // so the link is always shareable.
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const setSearchTerm = useCallback((value) => setParam('q', value, ''), [setParam])
  const setDepartment = useCallback((value) => setParam('dept', value, 'All'), [setParam])
  const setShiftFilter = useCallback((value) => setParam('shift', value, 'All'), [setParam])
  const setStartDate = useCallback((value) => setParam('start', value, today), [setParam, today])

  // Debounced so the row filter doesn't re-run on every keystroke — only
  // 300ms after typing pauses.
  const debouncedSearch = useDebounce(searchTerm, 300)

  // The 30-day column window, starting at the selected week.
  //
  // This MUST be memoized, and not for its own cost (30 strings is
  // nothing) — `dates` is a dependency of the conflict scan below. An
  // unmemoized array is a brand-new array object every render, so it
  // would never equal the previous one and the scan's cache would never
  // hit. One unstable dependency defeats every memo downstream of it.
  const dates = useMemo(() => getDateRange(fromDateKey(startDate)), [startDate])

  // Conflicts are derived from the roster, so they only need recomputing
  // when the roster (or the staffing threshold) changes. Note what is
  // NOT in this dependency list: searchTerm, department, shiftFilter.
  // Filtering changes which rows are VISIBLE, never who is assigned to
  // what — so typing in the search box no longer triggers a 9,000-cell
  // scan.
  //
  // Computed over ALL employees, not the filtered ones — under-staffing
  // is a fact about the whole department, and hiding rows mustn't make a
  // conflict disappear.
  const conflicts = useMemo(
    () => detectConflicts(employees, assignments, dates, minStaffing),
    [employees, assignments, dates, minStaffing],
  )
  const conflictSummary = useMemo(() => summarizeConflicts(conflicts), [conflicts])

  // Row filtering DOES depend on the search term — that's its whole job.
  // Memoizing it means an unrelated re-render (a poll result arriving, a
  // drag starting) doesn't re-filter 300 employees for nothing.
  const visibleEmployees = useMemo(
    () =>
      employees.filter((employee) => {
        if (department !== 'All' && employee.department !== department) return false
        if (
          debouncedSearch &&
          !employee.name.toLowerCase().includes(debouncedSearch.toLowerCase())
        ) {
          return false
        }
        if (shiftFilter !== 'All') {
          // Keep the row only if this employee has that shift somewhere in view.
          const hasShift = dates.some(
            (date) => assignments[makeKey(employee.id, date)] === shiftFilter,
          )
          if (!hasShift) return false
        }
        return true
      }),
    [employees, department, debouncedSearch, shiftFilter, dates, assignments],
  )

  useEffect(() => {
    getScheduleData().then((data) => {
      setEmployees(data.employees)
      setAssignments(data.assignments)
      setIsLoading(false)
    })
  }, [])

  // ── Request versioning (fixes the out-of-order save race) ──────────
  // Every change gets an increasing sequence number, and each affected
  // cell records the sequence of the LAST request that touched it. When a
  // response arrives we compare: if the cell has since been changed again,
  // this response is stale and we drop it on the floor.
  //
  // Why useRef and not useState: this bookkeeping must be readable and
  // writable synchronously (three drags can happen before React re-renders
  // once), and changing it should never itself trigger a render. A ref is
  // a mutable box that survives renders — exactly that.
  const requestSeq = useRef({ counter: 0, latestByCell: {} })

  // ── Latest-value ref ───────────────────────────────────────────────
  // A mirror of `assignments` that the drop handler can read WITHOUT
  // listing `assignments` as a dependency. That's what lets
  // handleDropShift keep one stable identity for the life of the page:
  // if it closed over `assignments` directly it would be a new function
  // after every edit, every row's memo check would fail, and the whole
  // grid would re-render — exactly the bug this item is about.
  //
  // Updating it in an effect (not during render) keeps render pure; the
  // ref is current before any user event can fire, because events only
  // happen after a commit.
  const assignmentsRef = useRef(assignments)
  useEffect(() => {
    assignmentsRef.current = assignments
  }, [assignments])

  // ── Optimistic update ──────────────────────────────────────────────
  // Apply `changes` ({ key: shift | undefined }) to the grid IMMEDIATELY,
  // record the previous values for undo, then fire the matching service
  // calls. When the "server" answers we reconcile (write back exactly what
  // it stored); if it throws we roll back to the remembered values.
  const applyChanges = useCallback((changes, request) => {
    const keys = Object.keys(changes)
    const previous = {}
    for (const key of keys) previous[key] = assignmentsRef.current[key]

    const seq = ++requestSeq.current.counter
    for (const key of keys) requestSeq.current.latestByCell[key] = seq

    const isLatestRequest = () =>
      keys.every((key) => requestSeq.current.latestByCell[key] === seq)

    setAssignments((prev) => patch(prev, changes))
    setHistory((prev) => [...prev, { cells: previous }])

    request()
      .then((confirmed) => {
        // A newer edit has claimed these cells since this request went out,
        // so this response is stale — drop it rather than let it overwrite.
        if (!isLatestRequest()) return
        setAssignments((prev) => patch(prev, confirmed))
      })
      .catch(() => {
        // Don't roll back either — a newer change already owns these cells.
        if (!isLatestRequest()) return
        setAssignments((prev) => patch(prev, previous))
      })
  }, [])

  // Wrapped in useCallback with an EMPTY dependency list, so every row and
  // cell receives the exact same function object on every render. This is
  // the other half of the React.memo fix — without it, memo compares
  // `onDropShift` and finds a different function each time, so nothing
  // ever bails out.
  const handleDropShift = useCallback(
    (payload, targetKey) => {
      if (payload.startsWith(DRAG_SHIFT)) {
        // Palette chip → cell: assign that shift type.
        const shift = payload.slice(DRAG_SHIFT.length)
        const { employeeId, date } = parseKey(targetKey)
        applyChanges({ [targetKey]: shift }, () =>
          assignShift(employeeId, date, shift).then((res) => ({ [res.key]: res.shift })),
        )
        return
      }

      if (payload.startsWith(DRAG_CELL)) {
        // Cell → cell: move. Exactly two keys change — the normalized
        // shape means we never touch the other 299 employees.
        const sourceKey = payload.slice(DRAG_CELL.length)
        if (sourceKey === targetKey) return
        applyChanges(
          { [targetKey]: assignmentsRef.current[sourceKey], [sourceKey]: undefined },
          () =>
            moveShift(sourceKey, targetKey).then((res) => ({
              [res.toKey]: res.shift,
              [res.fromKey]: undefined,
            })),
        )
      }
    },
    [applyChanges],
  )

  // ── Undo (single level) ────────────────────────────────────────────
  // Pop the last history entry and restore its previous cell values, both
  // locally and on the "server".
  const historyRef = useRef(history)
  useEffect(() => {
    historyRef.current = history
  }, [history])

  const handleUndo = useCallback(() => {
    // Read history from the ref, not from the `history` state variable:
    // the keydown listener below captures this function once, so a
    // closed-over `history` would stay frozen at its first-render value
    // (an empty array) no matter how many changes were made afterwards.
    const entries = historyRef.current
    const last = entries[entries.length - 1]
    if (!last) return

    // Undo overwrites these cells too, so it must take ownership of them
    // in the request-versioning bookkeeping — otherwise an edit that is
    // still in flight could resolve afterwards and undo the undo.
    const keys = Object.keys(last.cells)
    const seq = ++requestSeq.current.counter
    for (const key of keys) requestSeq.current.latestByCell[key] = seq

    setHistory((prev) => prev.slice(0, -1))
    setAssignments((prev) => patch(prev, last.cells))

    for (const [key, shift] of Object.entries(last.cells)) {
      const { employeeId, date } = parseKey(key)
      if (shift) assignShift(employeeId, date, shift)
      else unassignShift(employeeId, date)
    }
  }, [])

  // Ctrl+Z / Cmd+Z → undo. handleUndo is stable (useCallback with no
  // dependencies), so this listener is registered once and never needs
  // re-attaching — and, unlike before, the function it calls always sees
  // the current history.
  useEffect(() => {
    function onKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        handleUndo()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleUndo])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader size="lg" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Schedule</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Showing {visibleEmployees.length} of {employees.length} employees · {dates[0]} →{' '}
            {dates[dates.length - 1]}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleUndo} disabled={history.length === 0}>
          <FiRotateCcw size={14} />
          Undo
        </Button>
      </div>

      <ScheduleToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        department={department}
        onDepartmentChange={setDepartment}
        shiftFilter={shiftFilter}
        onShiftFilterChange={setShiftFilter}
        onPrevWeek={() => setStartDate(addDays(startDate, -7))}
        onNextWeek={() => setStartDate(addDays(startDate, 7))}
        onToday={() => setStartDate(today)}
      />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl bg-white p-3 shadow-sm dark:bg-gray-800">
        <ShiftPalette />

        <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          Min staff per shift
          <input
            type="number"
            min={0}
            max={20}
            value={minStaffing}
            onChange={(e) => setMinStaffing(Number(e.target.value))}
            className={`${CONTROL_CLASS} w-16`}
          />
        </label>

        <span className="text-sm">
          <span className="font-medium text-red-600">{conflictSummary.double}</span>
          <span className="text-gray-500 dark:text-gray-400"> double-booked · </span>
          <span className="font-medium text-orange-500">{conflictSummary.understaffed}</span>
          <span className="text-gray-500 dark:text-gray-400"> under-staffed shifts</span>
        </span>
      </div>

      {/* Stacks below the grid on narrow screens; min-w-0 lets the grid
          column shrink so the table scrolls inside itself rather than
          widening the page. */}
      <div className="flex flex-col items-start gap-4 xl:flex-row">
        <div className="w-full min-w-0 flex-1">
          <RosterGrid
            employees={visibleEmployees}
            dates={dates}
            assignments={assignments}
            conflicts={conflicts.cells}
            onDropShift={handleDropShift}
          />
        </div>

        {/* refreshToken changes on every roster edit, so the panel picks up
            a shift you just assigned for today without waiting a full
            interval. */}
        <OnShiftPanel department={department} refreshToken={history.length} />
      </div>
    </div>
  )
}

// Returns a new assignments object with `changes` applied. A value of
// `undefined` means "unassign" — the key is removed rather than stored,
// so a cleared cell and a never-assigned cell look identical.
function patch(assignments, changes) {
  const next = { ...assignments }
  for (const [key, shift] of Object.entries(changes)) {
    if (shift) next[key] = shift
    else delete next[key]
  }
  return next
}

export default Schedule
