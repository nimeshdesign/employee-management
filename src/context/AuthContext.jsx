import { createContext, useContext } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import * as authService from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Persisted the same way theme is (Phase 7's useLocalStorage) — so
  // refreshing the page doesn't silently log you out. Starts as `null`:
  // no seeded demo user anymore, so ProtectedRoute has something real to
  // guard against.
  const [user, setUser] = useLocalStorage('authUser', null)

  // Real request now — DummyJSON's /auth/login can genuinely fail (wrong
  // username/password → 400), so this throws on bad credentials instead
  // of always succeeding. The Login page is responsible for catching that.
  async function login(username, password) {
    const userData = await authService.login(username, password)
    setUser(userData)
  }

  function logout() {
    setUser(null)
  }

  // Merges partial updates into the current user — what the Profile form
  // calls on submit. There's still no real backend for profile edits
  // (DummyJSON's login doesn't cover that), so this stays local-only,
  // same as before.
  function updateProfile(updates) {
    setUser((prev) => ({ ...prev, ...updates }))
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
