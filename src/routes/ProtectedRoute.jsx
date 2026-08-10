import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Wraps a group of routes: with no logged-in user, redirect to /login
// instead of rendering the matched child. `replace` swaps the current
// history entry instead of pushing a new one, so the browser Back button
// doesn't bounce you into a redirect loop between the protected URL and
// /login.
function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

export default ProtectedRoute
