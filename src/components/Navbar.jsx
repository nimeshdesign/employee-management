import { FiMenu, FiSun, FiMoon, FiLogOut } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import Avatar from './ui/Avatar'

function Navbar({ onMenuClick }) {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-800 dark:bg-gray-800">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Toggle sidebar"
          className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white md:hidden"
        >
          <FiMenu size={22} />
        </button>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Employee Management
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
        >
          {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
        </button>
        <Avatar name={user?.name ?? 'Guest'} src={user?.avatar} size="sm" />
        <button
          onClick={handleLogout}
          aria-label="Log out"
          className="text-gray-500 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400"
        >
          <FiLogOut size={20} />
        </button>
      </div>
    </header>
  )
}

export default Navbar
