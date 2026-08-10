import api from './apiClient'
import { getExtrasForId } from './employeeExtras'

// Maps a raw GoRest user into this app's Employee shape. Every consumer
// of this service works with `Employee` objects — none of them know or
// care that the data actually came from GoRest's `User` resource. If we
// swap to our own Node/Express backend later, only this file changes.
function toEmployee(user, extras) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    gender: user.gender,
    status: user.status,
    ...extras,
  }
}

// GoRest's User only has these four fields — department/position/salary
// never get sent, they're stripped out before the request.
function toGoRestPayload(formData) {
  return {
    name: formData.name,
    email: formData.email,
    gender: formData.gender,
    status: formData.status,
  }
}

export async function getEmployees() {
  const response = await api.get('/users', { params: { per_page: 20 } })
  // We didn't create these employees ourselves, so we have no real
  // department/position/salary for them — derive consistent placeholders.
  return response.data.map((user) => toEmployee(user, getExtrasForId(user.id)))
}

export async function createEmployee(formData) {
  const response = await api.post('/users', toGoRestPayload(formData))
  // Unlike getEmployees, we DO have real extras here — the values the
  // user just typed into the form — so we use those instead of the
  // deterministic placeholder.
  const { department, position, salary } = formData
  return toEmployee(response.data, { department, position, salary })
}

export async function updateEmployee(id, formData) {
  const response = await api.put(`/users/${id}`, toGoRestPayload(formData))
  const { department, position, salary } = formData
  return toEmployee(response.data, { department, position, salary })
}

export async function deleteEmployee(id) {
  await api.delete(`/users/${id}`)
  return id
}
