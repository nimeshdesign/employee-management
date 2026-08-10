// GoRest's User model has no department/position/salary/avatar — fields
// this dashboard's UI needs. Until Phase 9 (Redux) gives us a real place
// to store and edit these per-employee, we derive them deterministically
// from the id so the UI has something consistent to render.
export const DEPARTMENTS = ['Engineering', 'Sales', 'HR', 'Marketing', 'Finance']
export const POSITIONS = ['Associate', 'Senior', 'Lead', 'Manager']

export function getExtrasForId(id) {
  return {
    department: DEPARTMENTS[id % DEPARTMENTS.length],
    position: POSITIONS[id % POSITIONS.length],
    salary: 40000 + (id % 10) * 5000,
  }
}