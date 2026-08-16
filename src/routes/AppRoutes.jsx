import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import ProtectedRoute from './ProtectedRoute'
import GuestRoute from './GuestRoute'

// React.lazy() splits each page into its own JS chunk, only downloaded
// when the user actually navigates to that route — instead of one big
// bundle containing every page upfront.
const Dashboard = lazy(() => import('../pages/Dashboard'))
const Employees = lazy(() => import('../pages/Employees'))
const Profile = lazy(() => import('../pages/Profile'))
const Settings = lazy(() => import('../pages/Settings'))
const Schedule = lazy(() => import('../pages/Schedule'))
const Login = lazy(() => import('../pages/Login'))

function AppRoutes() {
  return (
    // Suspense shows `fallback` while a lazy page's chunk is still downloading.
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      }
    >
      <Routes>
        {/* GuestRoute redirects to /dashboard if you're already logged in
            — covers the Back-button case where /login would otherwise
            still be reachable. */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* ProtectedRoute's <Outlet /> only renders MainLayout (and
            everything nested in it) when isAuthenticated is true;
            otherwise it redirects to /login before any of these ever mount. */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}

export default AppRoutes
