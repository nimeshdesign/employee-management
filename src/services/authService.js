import axios from 'axios'

// DummyJSON is a separate fake API from GoRest (which owns employee data)
// — auth is its own domain, so it gets its own axios instance and its own
// service file, the same "one file owns one external API" boundary
// employeeService.js draws around GoRest.
const dummyJsonApi = axios.create({ baseURL: 'https://dummyjson.com' })

export async function login(username, password) {
  // DummyJSON genuinely rejects bad credentials with a 400 — axios throws
  // on non-2xx by default, so a wrong username/password propagates as a
  // real error for the Login page to catch, not a rubber-stamped success.
  const response = await dummyJsonApi.post('/auth/login', { username, password })
  const data = response.data

  // Normalize DummyJSON's shape (firstName/lastName/image) into the User
  // shape the rest of this app already expects (name/email/avatar) — same
  // reason employeeService maps GoRest's User into our Employee shape.
  return {
    name: `${data.firstName} ${data.lastName}`,
    email: data.email,
    username: data.username,
    avatar: data.image,
    accessToken: data.accessToken,
  }
}
