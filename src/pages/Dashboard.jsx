import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { FiUserPlus, FiUsers, FiUser, FiSettings } from 'react-icons/fi'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Loader from '../components/ui/Loader'
import DepartmentChart from '../components/DepartmentChart'
import { fetchEmployees } from '../redux/slices/employeeSlice'
import { useAuth } from '../context/AuthContext'

const DEPARTMENTS = ['Engineering', 'Sales', 'HR', 'Marketing', 'Finance']

function StatCard({ label, value }) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-3xl font-semibold text-gray-800 dark:text-gray-100">{value}</span>
    </Card>
  )
}

function Dashboard() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { items: employees, status, newlyAddedIds } = useSelector((state) => state.employees)
  const isLoading = status === 'idle' || status === 'loading'

  // Same "fetch once" pattern as Employees.jsx — if you land on Dashboard
  // first, this triggers the fetch; if you've already visited Employees,
  // status is no longer 'idle' and this reuses the store's data instead
  // of re-fetching.
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchEmployees())
    }
  }, [status, dispatch])

  const activeCount = employees.filter((emp) => emp.status === 'active').length

  // Recomputed only when `employees` actually changes, not on every
  // Dashboard re-render (e.g. theme toggling, which re-renders this page
  // too since it reads useTheme indirectly via DepartmentChart).
  const departmentData = useMemo(
    () =>
      DEPARTMENTS.map((department) => ({
        department,
        count: employees.filter((emp) => emp.department === department).length,
      })),
    [employees],
  )

  const recentEmployees = useMemo(
    () => [...employees].sort((a, b) => b.id - a.id).slice(0, 5),
    [employees],
  )

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center gap-4">
          <Avatar name={user?.name} src={user?.avatar} size="lg" />
          <div>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Welcome back, {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Here&apos;s what&apos;s happening with your team today.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Employees" value={employees.length} />
        <StatCard label="Active Employees" value={activeCount} />
        <StatCard label="New Employees (this session)" value={newlyAddedIds.length} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Employee Distribution">
          <DepartmentChart data={departmentData} />
        </Card>

        <Card title="Recent Employees">
          {recentEmployees.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No employees yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {recentEmployees.map((emp) => (
                <li key={emp.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar name={emp.name} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{emp.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{emp.department}</p>
                  </div>
                  <Badge color={emp.status === 'active' ? 'accent' : 'gray'}>{emp.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Quick Actions">
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate('/employees')}>
            <FiUserPlus /> Add Employee
          </Button>
          <Button variant="secondary" onClick={() => navigate('/employees')}>
            <FiUsers /> View Employees
          </Button>
          <Button variant="secondary" onClick={() => navigate('/profile')}>
            <FiUser /> Edit Profile
          </Button>
          <Button variant="secondary" onClick={() => navigate('/settings')}>
            <FiSettings /> Settings
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default Dashboard
