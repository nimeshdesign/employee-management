import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// The mirror image of ProtectedRoute: redirects AWAY from routes that only
// make sense while logged out (just /login here). Without this, an
// already-authenticated user who ends up back on /login — via the browser
// Back button, or by typing the URL directly — would see the login form
// again instead of being sent back into the app.
function GuestRoute() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />
}

export default GuestRoute
