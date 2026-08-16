import { memo } from 'react'
import { SHIFT_COLORS, CONFLICT_STYLES, DRAG_CELL } from './shiftStyles'

// One grid cell. Every prop is a PRIMITIVE (string or a stable function),
// which is what makes React.memo's default shallow comparison useful
// here: `'Morning' === 'Morning'` is true, so a cell whose shift and
// conflict didn't change bails out of re-rendering entirely.
//
// The inline arrow functions below are created during THIS component's
// own render — which memo has already decided to skip when nothing
// changed — so they cost nothing. Inline handlers are only a problem
// when they're passed as props INTO a memoized child.
function ScheduleCell({ cellKey, shift, conflict, department, onDropShift }) {
  return (
    <td
      draggable={Boolean(shift)}
      title={
        conflict === 'double'
          ? 'Double-booked'
          : conflict === 'understaffed'
            ? `Under-staffed: ${department} ${shift}`
            : undefined
      }
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
      } ${conflict ? CONFLICT_STYLES[conflict] : ''}`}
    >
      {shift ?? ''}
    </td>
  )
}

export default memo(ScheduleCell)
