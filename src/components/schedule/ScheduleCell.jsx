import { memo } from 'react'
import { SHIFT_COLORS, CONFLICT_STYLES, DIMMED_CLASS, DRAG_CELL } from './shiftStyles'

// One grid cell. Every prop is a PRIMITIVE (string or a stable function),
// which is what makes React.memo's default shallow comparison useful
// here: `'Morning' === 'Morning'` is true, so a cell whose shift and
// conflict didn't change bails out of re-rendering entirely.
//
// The inline arrow functions below are created during THIS component's
// own render — which memo has already decided to skip when nothing
// changed — so they cost nothing. Inline handlers are only a problem
// when they're passed as props INTO a memoized child.
function ScheduleCell({ cellKey, shift, conflict, restNote, department, dimmed, onDropShift }) {
  // Why the explanation is written to a data attribute instead of held in
  // per-cell hover state: the grid puts ONE delegated mouse listener on
  // its scroll container and reads this off whichever cell the pointer is
  // over. A `useState` per cell would mean ~750 extra hooks on screen and
  // a re-render on every pointer crossing; a string attribute costs
  // nothing and leaves the memo comparison untouched.
  const note =
    conflict === 'double'
      ? 'Double-booked — this employee already has a shift that day'
      : conflict === 'rest'
        ? restNote
        : conflict === 'understaffed'
          ? `Under-staffed: fewer than the required minimum on ${department} ${shift}`
          : undefined

  return (
    <td
      draggable={Boolean(shift)}
      data-conflict-note={note}
      // The tooltip is drawn by the grid and is mouse-only, so the reason
      // would otherwise never reach a screen reader. An aria-label REPLACES
      // the cell's announced text, so the shift has to be repeated into it
      // — otherwise a flagged cell would announce its problem but not which
      // shift has the problem.
      //
      // This was previously a visually-hidden <span> inside the cell, which
      // was a mistake: `sr-only` is `position: absolute`, and the scroll
      // container is not positioned, so the spans escaped its
      // `overflow: auto` and stretched the DOCUMENT ~700px wide instead.
      // An attribute can't leak out of anything.
      aria-label={note ? `${shift ?? 'Empty'} — ${note}` : undefined}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', DRAG_CELL + cellKey)
        e.dataTransfer.effectAllowed = 'move'
      }}
      // The browser's DEFAULT for dragover is "drop not allowed".
      // preventDefault() flips it — without this line, onDrop never fires
      // and the drop silently does nothing.
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        onDropShift(e.dataTransfer.getData('text/plain'), cellKey)
      }}
      // An unassigned cell still needs its OWN background. Left transparent
      // it shows whatever happens to be behind the table, which reads as
      // arbitrary light/dark patches rather than "empty".
      className={`h-10 border-b border-r border-gray-200 text-center align-middle dark:border-gray-700 ${
        shift ? `cursor-grab ${SHIFT_COLORS[shift]}` : 'bg-white dark:bg-gray-800'
      } ${conflict ? CONFLICT_STYLES[conflict] : ''} ${dimmed ? DIMMED_CLASS : ''}`}
    >
      {shift ?? ''}
    </td>
  )
}

export default memo(ScheduleCell)
