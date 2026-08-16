import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import SearchBar from '../ui/SearchBar'
import Button from '../ui/Button'
import { DEPARTMENTS } from '../../services/employeeExtras'
import { SHIFT_TYPES } from '../../services/scheduleService'
import { CONTROL_CLASS } from './shiftStyles'

// Fully controlled: every value comes from the parent and every change
// is reported back up. This component owns NO state of its own — the
// page decides where filter state lives (it lives in the URL).
function ScheduleToolbar({
  searchTerm,
  onSearchChange,
  department,
  onDepartmentChange,
  shiftFilter,
  onShiftFilterChange,
  onPrevWeek,
  onNextWeek,
  onToday,
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="w-full sm:w-56">
        <SearchBar value={searchTerm} onChange={onSearchChange} placeholder="Search employee..." />
      </div>

      <select
        value={department}
        onChange={(e) => onDepartmentChange(e.target.value)}
        className={CONTROL_CLASS}
        aria-label="Filter by department"
      >
        <option value="All">All departments</option>
        {DEPARTMENTS.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      <select
        value={shiftFilter}
        onChange={(e) => onShiftFilterChange(e.target.value)}
        className={CONTROL_CLASS}
        aria-label="Filter by shift"
      >
        <option value="All">All shifts</option>
        {SHIFT_TYPES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onPrevWeek} aria-label="Previous week">
          <FiChevronLeft size={16} />
        </Button>
        <Button variant="ghost" size="sm" onClick={onToday}>
          Today
        </Button>
        <Button variant="ghost" size="sm" onClick={onNextWeek} aria-label="Next week">
          <FiChevronRight size={16} />
        </Button>
      </div>
    </div>
  )
}

export default ScheduleToolbar
