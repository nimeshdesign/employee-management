import { memo } from 'react'
import ScheduleCell from './ScheduleCell'
import { makeKey } from '../../services/scheduleService'
import { ROW_HEIGHT } from './shiftStyles'

// The explicit height is load-bearing, not cosmetic: the grid works out
// which rows are on screen with `scrollTop / ROW_HEIGHT`, so a row that
// grew to fit its content would put every row below it in the wrong place.
function EmployeeRow({
  employee,
  dates,
  assignments,
  conflicts,
  restNotes,
  shiftFilter,
  onDropShift,
}) {
  return (
    <tr style={{ height: ROW_HEIGHT }}>
      <td className="sticky left-0 z-10 h-10 w-40 max-w-40 overflow-hidden whitespace-nowrap border-b border-r border-gray-200 bg-white px-3 leading-tight dark:border-gray-700 dark:bg-gray-800">
        <div className="font-medium text-gray-800 dark:text-gray-100">{employee.name}</div>
        <div className="text-[10px] text-gray-400">{employee.department}</div>
      </td>
      {dates.map((date) => {
        const cellKey = makeKey(employee.id, date)
        const shift = assignments[cellKey]
        return (
          <ScheduleCell
            key={date}
            cellKey={cellKey}
            shift={shift}
            conflict={conflicts[cellKey]}
            restNote={restNotes[cellKey]}
            department={employee.department}
            // Resolved to a boolean HERE rather than passing shiftFilter
            // down: the cell's props stay primitive and, more usefully,
            // only the handful of cells whose dimmed state actually flips
            // fail their memo check when the filter changes.
            dimmed={shiftFilter !== 'All' && shift !== shiftFilter}
            onDropShift={onDropShift}
          />
        )
      })}
    </tr>
  )
}

// A custom comparison function (memo's second argument). The DEFAULT
// shallow compare would be useless here: `assignments` and `conflicts`
// are whole-roster objects that get a brand-new identity on every edit,
// so every row would fail the check and re-render — even though a single
// drop only affects one or two cells.
//
// So instead of asking "did the roster change?", each row asks the much
// narrower question: "did any of MY OWN 30 keys change?" Moving Raj's
// Tuesday shift now re-renders Raj's row only; the other 299 bail out.
//
// Return true = props are equal = SKIP the re-render. (Note this is the
// opposite polarity of shouldComponentUpdate, and a classic source of
// "my memo does nothing" bugs.)
function areRowPropsEqual(prev, next) {
  if (
    prev.employee !== next.employee ||
    prev.dates !== next.dates ||
    prev.shiftFilter !== next.shiftFilter ||
    prev.onDropShift !== next.onDropShift
  ) {
    return false
  }
  for (const date of next.dates) {
    const cellKey = makeKey(next.employee.id, date)
    if (prev.assignments[cellKey] !== next.assignments[cellKey]) return false
    if (prev.conflicts[cellKey] !== next.conflicts[cellKey]) return false
    if (prev.restNotes[cellKey] !== next.restNotes[cellKey]) return false
  }
  return true
}

export default memo(EmployeeRow, areRowPropsEqual)
