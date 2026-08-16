import { makeKey, SHIFT_TYPES } from '../services/scheduleService'

// Default minimum headcount per department + shift + day. Configurable
// from the page; below this the shift is flagged as under-staffed.
export const DEFAULT_MIN_STAFFING = 2

// Scans EVERY employee × EVERY day in view and returns which cells are in
// conflict, and why. Two kinds of conflict:
//   (a) double-booked  — one employee holds more than one shift on a day
//   (b) under-staffed  — a department+shift+day has fewer people than
//                        `minStaffing` (Off doesn't count as staffing)
//
// Returns { [cellKey]: 'double' | 'understaffed' } — only conflicting
// cells appear, so an absent key means "fine".
//
// Note on (a): because assignments are keyed by employee+date, one key
// can only hold ONE shift, so a true double-booking can't be stored in
// this data shape at all. The check stays here so it keeps working if
// the shape ever changes (e.g. split shifts), and to make the task's two
// conflict types explicit — but expect it to find nothing today.
//
// This is a pure function of its inputs: same employees + assignments +
// dates in → same conflicts out. Conflicts are DERIVED state — we never
// store them, we recompute them.
export function detectConflicts(employees, assignments, dates, minStaffing) {
  const conflicts = {}

  // (a) Double-booked: count shifts per employee per day.
  // With the current key shape each (employee, date) has at most one
  // entry, so this loop only ever sees counts of 0 or 1.
  const perEmployeeDay = {}
  for (const key of Object.keys(assignments)) {
    perEmployeeDay[key] = (perEmployeeDay[key] || 0) + 1
    if (perEmployeeDay[key] > 1) conflicts[key] = 'double'
  }

  // (b) Under-staffed: headcount per department+shift+day.
  const headcount = {} // "Engineering|Night|2026-08-14" → count
  const membersOf = {} // same key → [cellKey, ...] so we can flag them
  for (const employee of employees) {
    for (const date of dates) {
      const key = makeKey(employee.id, date)
      const shift = assignments[key]
      if (!shift || shift === 'Off') continue
      const group = `${employee.department}|${shift}|${date}`
      headcount[group] = (headcount[group] || 0) + 1
      ;(membersOf[group] ||= []).push(key)
    }
  }

  // Also cover department+shift+day combos with ZERO people. Those have
  // no cells to flag, so we report them separately for a summary banner.
  const departments = [...new Set(employees.map((e) => e.department))]
  const understaffedGroups = []
  for (const department of departments) {
    for (const shift of SHIFT_TYPES) {
      if (shift === 'Off') continue
      for (const date of dates) {
        const group = `${department}|${shift}|${date}`
        const count = headcount[group] || 0
        if (count < minStaffing) {
          understaffedGroups.push({ department, shift, date, count })
          for (const cellKey of membersOf[group] || []) {
            // Double-booking outranks under-staffing if both apply.
            if (!conflicts[cellKey]) conflicts[cellKey] = 'understaffed'
          }
        }
      }
    }
  }

  return { cells: conflicts, understaffedGroups }
}

// Small helper for the summary line: "3 double-booked, 41 under-staffed".
export function summarizeConflicts({ cells, understaffedGroups }) {
  const double = Object.values(cells).filter((c) => c === 'double').length
  return { double, understaffed: understaffedGroups.length }
}
