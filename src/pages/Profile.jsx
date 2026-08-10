import { useState } from 'react'
import { useForm } from 'react-hook-form'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import { useAuth } from '../context/AuthContext'

// Unlike the Employee forms, this one is fully real: onSubmit calls
// AuthContext's updateProfile, which is genuinely global state — save a
// new name here and the Navbar avatar updates immediately, with zero
// extra wiring, because both read the same context.
function Profile() {
  const { user, updateProfile } = useAuth()
  const [justSaved, setJustSaved] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: user })

  function onSubmit(formData) {
    updateProfile(formData)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2000)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Profile</h1>

      <Card>
        <div className="mb-6 flex items-center gap-4">
          <Avatar name={user?.name} src={user?.avatar} size="lg" />
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-100">{user?.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full name"
            id="name"
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
          />
          <Input
            label="Email"
            id="email"
            type="email"
            error={errors.email?.message}
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
            })}
          />

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit">Save changes</Button>
            {justSaved && <span className="text-sm text-emerald-600">Saved</span>}
          </div>
        </form>
      </Card>
    </div>
  )
}

export default Profile