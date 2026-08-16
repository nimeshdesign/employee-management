import { DEPARTMENTS } from './employeeExtras'

// ── The schedule domain ─────────────────────────────────────────────────
// No real backend exists for scheduling, so this file IS the backend:
// it owns seeding, persistence (localStorage) and simulated network
// latency. Same boundary employeeService.js draws around GoRest — if a
// real API shows up later, only this file changes.

export const SHIFT_TYPES = ['Morning', 'Afternoon', 'Night', 'Off']

// Hour ranges used by the "Currently on shift" panel. Night wraps past
// midnight (22:00 → 06:00), which is why isOnShiftNow() below can't just
// do a simple `start <= hour < end` comparison for every shift.
export const SHIFT_HOURS = {
  Morning: { start: 6, end: 14 },
  Afternoon: { start: 14, end: 22 },
  Night: { start: 22, end: 6 },
}

export const EMPLOYEE_COUNT = 300
export const DAYS_IN_VIEW = 30

const STORAGE_KEY = 'schedule_data'

// ── Assignment identity ─────────────────────────────────────────────────
// Assignments live in ONE flat object, keyed by "employeeId_date":
//
//   assignments = {
//     "12_2026-08-14": "Morning",
//     "12_2026-08-15": "Night",
//     "45_2026-08-14": "Afternoon",
//   }
//
// This is the "normalized" shape the task asks for. The payoff: moving
// one shift touches exactly two keys (delete one, set one) — it never
// rebuilds a per-employee array of 30 entries, and never copies the
// other 299 employees' data. A side effect worth noticing: because the
// key bakes in employee+date, this shape makes "two shifts for the same
// person on the same day" impossible to even represent.

export function makeKey(employeeId, date) {
  return `${employeeId}_${date}`
}

export function parseKey(key) {
  const [employeeId, date] = key.split('_')
  return { employeeId: Number(employeeId), date }
}

// Local YYYY-MM-DD (not toISOString(), which converts to UTC and can
// shift the date by a day depending on the user's timezone).
export function toDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Inverse of toDateKey. `new Date('2026-08-16')` would parse as UTC
// midnight and can land on the previous local day — so build it from
// parts instead.
export function fromDateKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Shift a YYYY-MM-DD key by `days` (negative allowed).
export function addDays(key, days) {
  const d = fromDateKey(key)
  d.setDate(d.getDate() + days)
  return toDateKey(d)
}

// The 30-day window the grid renders, starting today.
export function getDateRange(startDate = new Date(), days = DAYS_IN_VIEW) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    return toDateKey(d)
  })
}

// ── Seeding ─────────────────────────────────────────────────────────────
// 300 deterministic-ish employees. Names come from combining two pools —
// enough variety that searching "Raj" narrows to a handful of rows.

const FIRST_NAMES = [
  'Raj', 'Priya', 'Amit', 'Nidhi', 'Sanjay', 'Meera', 'Vikram', 'Anita',
  'Rohan', 'Kavita', 'Arjun', 'Sneha', 'Karan', 'Pooja', 'Nikhil', 'Divya',
  'Suresh', 'Anjali', 'Manish', 'Ritu',
]
const LAST_NAMES = [
  'Patel', 'Shah', 'Sharma', 'Mehta', 'Desai', 'Joshi', 'Verma', 'Gupta',
  'Reddy', 'Nair', 'Iyer', 'Chauhan', 'Bhatt', 'Trivedi', 'Kulkarni',
]

function seedEmployees() {
  return Array.from({ length: EMPLOYEE_COUNT }, (_, i) => {
    const id = i + 1
    return {
      id,
      name: `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length]}`,
      department: DEPARTMENTS[id % DEPARTMENTS.length],
    }
  })
}

// Pre-fill ~70% of cells so the grid isn't a blank wall on first load and
// under-staffing conflicts genuinely occur in the seed data. Math.random
// is fine here — this runs once, then the result is persisted.
function seedAssignments(employees) {
  const assignments = {}
  const dates = getDateRange()
  for (const employee of employees) {
    for (const date of dates) {
      if (Math.random() < 0.7) {
        const shift = SHIFT_TYPES[Math.floor(Math.random() * SHIFT_TYPES.length)]
        assignments[makeKey(employee.id, date)] = shift
      }
    }
  }
  return assignments
}

// ── Persistence ─────────────────────────────────────────────────────────

function loadStore() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) return JSON.parse(raw)
  const employees = seedEmployees()
  const store = { employees, assignments: seedAssignments(employees) }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  return store
}

function saveStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

// ── Simulated network ───────────────────────────────────────────────────
// Every public function resolves after a RANDOM 200–1500ms delay. The
// randomness is the point: it means two requests sent back-to-back can
// resolve in the OPPOSITE order they were sent — exactly the real-network
// behavior Milestone 2's race-condition item depends on being able to
// reproduce.

function withLatency(produceResult) {
  const delay = 200 + Math.random() * 1300
  return new Promise((resolve) => {
    setTimeout(() => resolve(produceResult()), delay)
  })
}

// ── Public API ──────────────────────────────────────────────────────────

// ONE request returns everything the grid needs — employees AND all
// assignments. (Milestone 2 checks the page doesn't fire 300 requests.)
export function getScheduleData() {
  return withLatency(() => loadStore())
}

// Assign (or overwrite) one cell. Returns what the "server" actually
// stored, so the caller can reconcile its optimistic guess against it.
export function assignShift(employeeId, date, shift) {
  return withLatency(() => {
    const store = loadStore()
    const key = makeKey(employeeId, date)
    store.assignments[key] = shift
    saveStore(store)
    return { key, shift }
  })
}

// Remove one cell's shift (used by undo when the previous value was
// "unassigned", and by dragging a shift away from a cell).
export function unassignShift(employeeId, date) {
  return withLatency(() => {
    const store = loadStore()
    const key = makeKey(employeeId, date)
    delete store.assignments[key]
    saveStore(store)
    return { key, shift: null }
  })
}

// Move a shift between two cells: exactly two keys change, regardless of
// how many employees exist — the payoff of the normalized shape.
export function moveShift(fromKey, toKey) {
  return withLatency(() => {
    const store = loadStore()
    const shift = store.assignments[fromKey]
    delete store.assignments[fromKey]
    store.assignments[toKey] = shift
    saveStore(store)
    return { fromKey, toKey, shift }
  })
}

// Who is clocked in at this moment, per today's assignments. Lives in the
// service (not computed in the component) so the panel has something to
// genuinely poll — which is what Milestone 2's leak hunt needs.
export function getOnShiftNow() {
  return withLatency(() => {
    const store = loadStore()
    const today = toDateKey(new Date())
    const hour = new Date().getHours()
    return store.employees.filter((employee) => {
      const shift = store.assignments[makeKey(employee.id, today)]
      if (!shift || shift === 'Off') return false
      const { start, end } = SHIFT_HOURS[shift]
      // Night wraps midnight: on-shift means AFTER 22:00 or BEFORE 06:00.
      return start < end ? hour >= start && hour < end : hour >= start || hour < end
    })
  })
}
