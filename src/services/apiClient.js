import axios from 'axios'

// A single configured axios instance, reused by every service file.
// baseURL means callers just write api.get('/users') instead of the full URL.
const api = axios.create({
  baseURL: import.meta.env.VITE_GOREST_BASE_URL,
})

// Request interceptor: runs before every request. GoRest's GET endpoints
// are public, but POST/PUT/DELETE need the Bearer token — attaching it
// only for writes means a missing/invalid token can't silently break reads.
api.interceptors.request.use((config) => {
  const isWrite = config.method !== 'get'
  if (isWrite) {
    config.headers.Authorization = `Bearer ${import.meta.env.VITE_GOREST_TOKEN}`
  }
  return config
})

export default api