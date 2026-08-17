import { makeKey, addDays, SHIFT_TYPES, SHIFT_HOURS } from '../services/scheduleService'

// Default minimum headcount per department + shift + day. Configurable
// from the page; below this the shift is flagged as under-staffed.
export const DEFAULT_MIN_STAFFING = 2

// Minimum hours off between the end of one shift and the start of the
// next. Set to 1 so it catches the impossible case — Night finishing at
// 06:00 and Morning starting at 06:00, zero rest — without also
// condemning the merely unpleasant ones.
//
// Raising this to 11 (the rest period a lot of working-time regulations
// use) additionally flags the two 8-hour turnarounds: Night → Afternoon,
// and Afternoon → Morning, the classic "clopening". Those are real
// scheduling smells, but they're a policy choice rather than an
// impossibility, so they aren't flagged by default.
export const DEFAULT_MIN_REST_HOURS = 1

// How long a shift lasts, in hours. Night is stored as 22 → 6, which
// wraps midnight, so a plain `end - start` would give -16.
function shiftLength(shift) {
  const { start, end } = SHIFT_HOURS[shift]
  return end > start ? end - start : end + 24 - start
}

// Hours of rest between `shift` on some day and `nextShift` the day
// after. Both are measured on one continuous timeline whose origin is
// midnight at the start of the first day, which is what lets Night's
// overnight span be compared against the next morning without any
// special-casing:
//
//   Night   22:00 → 30:00 (06:00 next day)
//   Morning 30:00 → 38:00 (06:00 → 14:00 next day)
//   rest = 30 - 30 = 0 hours
export function restHoursBetween(shift, nextShift) {
  const end = SHIFT_HOURS[shift].start + shiftLength(shift)
  const nextStart = SHIFT_HOURS[nextShift].start + 24
  return nextStart - end
}

// Scans EVERY employee × EVERY day in view and returns which cells are in
// conflict, and why. Three kinds of conflict:
//   (a) double-booked  — one employee holds more than one shift on a day
//   (b) under-staffed  — a department+shift+day has fewer people than
//                        `minStaffing` (Off doesn't count as staffing)
//   (c) short rest     — an employee's shift ends too close to the start
//                        of their shift the following day
//
// Returns { [cellKey]: 'double' | 'rest' | 'understaffed' } — only
// conflicting cells appear, so an absent key means "fine".
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
export function detectConflicts(
  employees,
  assignments,
  dates,
  minStaffing,
  minRestHours = DEFAULT_MIN_REST_HOURS,
) {
  const conflicts = {}

  // (a) Double-booked: count shifts per employee per day.
  // With the current key shape each (employee, date) has at most one
  // entry, so this loop only ever sees counts of 0 or 1.
  const perEmployeeDay = {}
  for (const key of Object.keys(assignments)) {
    perEmployeeDay[key] = (perEmployeeDay[key] || 0) + 1
    if (perEmployeeDay[key] > 1) conflicts[key] = 'double'
  }

  // (c) Short rest between consecutive days. Night → next-day Morning is
  // the case that matters: the Night shift ends at 06:00 and the Morning
  // shift starts at 06:00, so the person would have to work straight
  // through. Both cells are flagged, because a violation is a property of
  // the PAIR — there's no way to say which of the two is the wrong one,
  // and fixing either resolves it.
  //
  // The scan starts one day BEFORE the window so the first visible column
  // gets checked against the day preceding it. Otherwise the same roster
  // would report different conflicts depending on which week you happened
  // to be looking at.
  // Kept as a map of cellKey → STRING, deliberately parallel to `cells`
  // rather than folded into it as an object value. Cells compare their
  // conflict props with `!==`, and a fresh object per scan would fail that
  // check every time, re-rendering rows that hadn't actually changed.
  const restNotes = {}
  const restViolations = []
  const restDates = [addDays(dates[0], -1), ...dates]
  for (const employee of employees) {
    for (let i = 0; i < restDates.length - 1; i++) {
      const key = makeKey(employee.id, restDates[i])
      const nextKey = makeKey(employee.id, restDates[i + 1])
      const shift = assignments[key]
      const nextShift = assignments[nextKey]
      if (!shift || !nextShift || shift === 'Off' || nextShift === 'Off') continue

      const rest = restHoursBetween(shift, nextShift)
      if (rest >= minRestHours) continue

      restViolations.push({
        employee,
        date: restDates[i],
        shift,
        nextShift,
        rest,
      })
      const note = `Only ${rest}h rest: ${shift} then ${nextShift} the next day`
      restNotes[key] = note
      restNotes[nextKey] = note

      // Double-booking outranks a rest violation if both somehow apply.
      if (!conflicts[key]) conflicts[key] = 'rest'
      if (!conflicts[nextKey]) conflicts[nextKey] = 'rest'
    }
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
            // Under-staffing is the softest of the three, so it only
            // claims cells nothing else has already flagged.
            if (!conflicts[cellKey]) conflicts[cellKey] = 'understaffed'
          }
        }
      }
    }
  }

  return { cells: conflicts, restNotes, understaffedGroups, restViolations }
}

// Small helper for the summary line: "3 double-booked · 12 short rest ·
// 41 under-staffed". Rest violations are counted as PAIRS, not as cells —
// each one flags two cells, so counting cells would double every figure.
export function summarizeConflicts({ cells, understaffedGroups, restViolations }) {
  const double = Object.values(cells).filter((c) => c === 'double').length
  return { double, rest: restViolations.length, understaffed: understaffedGroups.length }
}
