import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { FiUsers, FiCheckCircle, FiGrid, FiBarChart2 } from 'react-icons/fi'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'

const FEATURES = [
  { icon: FiGrid, text: 'A modern, at-a-glance dashboard' },
  { icon: FiUsers, text: 'Effortless employee management' },
  { icon: FiBarChart2, text: 'Real-time distribution insights' },
]

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loginError, setLoginError] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  // RHF tracks `isSubmitting` automatically because this onSubmit returns
  // a promise — no separate useState needed for the loading flag, unlike
  // the manual isLoading we wrote by hand back in Phase 5.
  async function onSubmit({ username, password }) {
    setLoginError(null)
    try {
      await login(username, password)
      // replace: true swaps this history entry instead of pushing a new
      // one — without it, /login stays in history right under /dashboard,
      // so pressing Back after logging in lands you right back on the
      // login form even though you're still authenticated.
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setLoginError(err.response?.data?.message ?? 'Login failed. Check your credentials.')
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Branded panel — hidden below md, since there's no room for a
          decorative side column on a phone-width screen. */}
      <div className="relative hidden w-1/2 items-center justify-center overflow-hidden bg-primary p-12 md:flex">
        {/* Soft decorative glows — pure CSS, no image assets. */}
        <div className="absolute -left-16 -top-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-10 h-80 w-80 rounded-full bg-accent/30 blur-3xl" />

        <div className="relative max-w-md text-white">
          <div className="mb-8 flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 text-lg font-bold">
              EMS
            </span>
            <span className="text-lg font-semibold">Employee Management</span>
          </div>

          <h1 className="mb-4 text-3xl font-semibold leading-tight">
            Everything about your team, in one place.
          </h1>
          <p className="mb-8 text-white/80">
            Sign in to manage employees, track distribution across departments, and
            keep your organization&apos;s data in sync.
          </p>

          <ul className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-white/90">
                <FiCheckCircle className="shrink-0 text-accent" size={18} />
                <Icon className="shrink-0 opacity-70" size={16} />
                <span className="text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full items-center justify-center px-4 md:w-1/2">
        <div className="w-full max-w-sm">
          <h2 className="mb-1 text-2xl font-semibold text-gray-800 dark:text-gray-100">
            Welcome back
          </h2>
          <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">
            Sign in with a DummyJSON test account — try <code>emilys</code> /{' '}
            <code>emilyspass</code>.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Username"
              id="username"
              error={errors.username?.message}
              {...register('username', { required: 'Username is required' })}
            />
            <Input
              label="Password"
              id="password"
              type="password"
              error={errors.password?.message}
              {...register('password', { required: 'Password is required' })}
            />

            {loginError && <p className="text-sm text-red-600">{loginError}</p>}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
