import { NavLink } from 'react-router-dom'
import { FiGrid, FiUsers, FiUser, FiSettings } from 'react-icons/fi'

const LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: FiGrid },
  { to: '/employees', label: 'Employees', icon: FiUsers },
  { to: '/profile', label: 'Profile', icon: FiUser },
  { to: '/settings', label: 'Settings', icon: FiSettings },
]

// On desktop (md+) this is always visible via `md:translate-x-0 md:static`.
// On mobile it's a fixed drawer that slides in/out based on `isOpen`,
// controlled by MainLayout's useState.
function Sidebar({ isOpen, onClose }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-56 shrink-0 flex-col border-r border-gray-200 bg-white p-4 transition-transform duration-200 dark:border-gray-800 dark:bg-gray-800 md:static md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <span className="mb-6 px-2 text-lg font-bold text-primary">EMS</span>
      <nav className="flex flex-col gap-1">
        {LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar