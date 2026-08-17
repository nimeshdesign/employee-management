import { useState, useRef, useEffect, useCallback } from 'react'
import EmployeeRow from './EmployeeRow'
import { ROW_HEIGHT } from './shiftStyles'

// Rows rendered above and below the viewport. Without a margin, a fast
// scroll paints blank space for a frame before React catches up; with a
// few spare rows the buffer is already there.
const OVERSCAN = 6

// "Aug 14" style header — the raw YYYY-MM-DD key would be too wide.
function formatHeader(dateKey) {
  const [, m, d] = dateKey.split('-')
  const month = new Date(2000, Number(m) - 1, 1).toLocaleString('en', { month: 'short' })
  return `${month} ${Number(d)}`
}

// The grid renders only the rows currently visible in the scroll
// container. The full 300 rows still EXIST in the data and the scrollbar
// still reflects all of them — two spacer rows stand in for the rows
// above and below the window, so the scroll geometry is unchanged. What
// drops is the DOM: ~25 rows × 30 columns instead of 300 × 30.
function RosterGrid({
  employees,
  dates,
  assignments,
  conflicts,
  restNotes,
  shiftFilter,
  onDropShift,
}) {
  const containerRef = useRef(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(600)

  // Measure the scroll container instead of assuming a height, so the
  // window count stays right when the browser is resized.
  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const measure = () => setViewportHeight(element.clientHeight)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // Scroll fires far more often than the screen refreshes. Coalescing
  // updates into one per animation frame means at most one re-render per
  // painted frame, instead of one per scroll event.
  const frameRef = useRef(0)
  const handleScroll = useCallback((e) => {
    const top = e.currentTarget.scrollTop
    // A tooltip is positioned against a cell's viewport rect, so once the
    // grid scrolls it is pointing at the wrong place. Dismiss it rather
    // than try to keep it attached.
    setTooltip(null)
    hoveredCellRef.current = null
    if (frameRef.current) return
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0
      setScrollTop(top)
    })
  }, [])

  useEffect(() => () => cancelAnimationFrame(frameRef.current), [])

  // ── Conflict tooltip ───────────────────────────────────────────────
  // ONE listener on the scroll container, not one per cell. `mouseover`
  // (which bubbles, unlike `mouseenter`) fires as the pointer crosses each
  // cell; `closest()` walks up to the nearest cell carrying an
  // explanation. Cells stay completely unaware that hovering exists, so
  // none of this can invalidate their memoization.
  const [tooltip, setTooltip] = useState(null)
  const hoveredCellRef = useRef(null)

  const handleMouseOver = useCallback((e) => {
    const cell = e.target.closest?.('td[data-conflict-note]') ?? null
    // Moving WITHIN the same cell fires repeatedly — bail so a pointer
    // resting on one cell doesn't re-render the grid on every jitter.
    if (cell === hoveredCellRef.current) return
    hoveredCellRef.current = cell

    if (!cell) {
      setTooltip(null)
      return
    }
    const rect = cell.getBoundingClientRect()
    // Flip below the cell when there isn't room above it, so a conflict in
    // the top row isn't explained by a bubble off the top of the screen.
    const below = rect.top < 72
    setTooltip({
      text: cell.dataset.conflictNote,
      x: rect.left + rect.width / 2,
      y: below ? rect.bottom + 8 : rect.top - 8,
      below,
    })
  }, [])

  const handleMouseLeave = useCallback(() => {
    hoveredCellRef.current = null
    setTooltip(null)
  }, [])

  // Clamped to the list length: filtering can shrink the roster below the
  // current scroll offset, and for the frame before the browser clamps
  // scrollTop the window would otherwise fall past the end and render
  // nothing.
  const firstVisible = Math.min(
    Math.max(0, employees.length - 1),
    Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN),
  )
  const windowSize = Math.ceil(viewportHeight / ROW_HEIGHT) + OVERSCAN * 2
  const lastVisible = Math.min(employees.length, firstVisible + windowSize)
  const visibleEmployees = employees.slice(firstVisible, lastVisible)

  const padTop = firstVisible * ROW_HEIGHT
  const padBottom = (employees.length - lastVisible) * ROW_HEIGHT
  const columnCount = dates.length + 1

  return (
    <>
      {/* Rendered OUTSIDE the scroll container and positioned `fixed`. A
          tooltip nested inside the table would be clipped by
          `overflow-auto` the moment it extended past a cell — the usual
          reason tooltips in scrollable grids appear cut in half. */}
      {tooltip && (
        <div
          role="tooltip"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: `translate(-50%, ${tooltip.below ? '0' : '-100%'})`,
          }}
          className="pointer-events-none fixed z-50 max-w-64 rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg dark:bg-gray-700"
        >
          {tooltip.text}
        </div>
      )}

      <div
        ref={containerRef}
        onScroll={handleScroll}
        onMouseOver={handleMouseOver}
        onMouseLeave={handleMouseLeave}
        // `relative` is not decoration. An absolutely positioned descendant
        // is only clipped by an overflow ancestor that is ITSELF positioned;
        // without this, anything absolute inside the grid escapes the
        // scroll box and widens the whole document instead. Making the
        // container a containing block keeps that contained by default.
        className="relative max-h-[calc(100dvh-20rem)] w-full overflow-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
      >
        <table className="w-max border-separate border-spacing-0 text-xs">
          <thead>
            <tr>
              {/* Top-left corner cell: sticky in BOTH directions, so it stays
                  pinned when scrolling either way. Higher z-index than the
                  other sticky cells so it paints on top where they overlap. */}
              <th className="sticky left-0 top-0 z-30 min-w-40 border-b border-r border-gray-200 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                Employee
              </th>
              {dates.map((date) => (
                <th
                  key={date}
                  className="sticky top-0 z-20 min-w-16 border-b border-r border-gray-200 bg-gray-50 px-1 py-2 text-center font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  {formatHeader(date)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Spacer standing in for the rows scrolled off the top. */}
            {padTop > 0 && (
              <tr aria-hidden="true">
                <td colSpan={columnCount} className="border-0 p-0" style={{ height: padTop }} />
              </tr>
            )}

            {visibleEmployees.map((employee) => (
              <EmployeeRow
                key={employee.id}
                employee={employee}
                dates={dates}
                assignments={assignments}
                conflicts={conflicts}
                restNotes={restNotes}
                shiftFilter={shiftFilter}
                onDropShift={onDropShift}
              />
            ))}

            {/* …and for the rows still below the fold. */}
            {padBottom > 0 && (
              <tr aria-hidden="true">
                <td colSpan={columnCount} className="border-0 p-0" style={{ height: padBottom }} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default RosterGrid
