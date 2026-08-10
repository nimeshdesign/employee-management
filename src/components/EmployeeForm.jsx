import { useForm } from 'react-hook-form'
import Input from './ui/Input'
import Button from './ui/Button'
import { DEPARTMENTS, POSITIONS } from '../services/employeeExtras'

const SELECT_CLASS =
  'rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100'

// Shared by both "Add Employee" and "Edit Employee" — same fields either
// way, the only difference is whether `defaultValues` is empty or an
// existing employee. register() wires each field to RHF via ref, so
// typing here doesn't re-render this component — only formState.errors
// changing (i.e. a validation result) does.
function EmployeeForm({ defaultValues, onSubmit, onCancel, submitLabel = 'Save' }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues })

  return (
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

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="gender" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Gender
          </label>
          <select id="gender" className={SELECT_CLASS} {...register('gender', { required: true })}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Status
          </label>
          <select id="status" className={SELECT_CLASS} {...register('status', { required: true })}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="department" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Department
          </label>
          <select id="department" className={SELECT_CLASS} {...register('department', { required: true })}>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="position" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Position
          </label>
          <select id="position" className={SELECT_CLASS} {...register('position', { required: true })}>
            {POSITIONS.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Input
        label="Salary"
        id="salary"
        type="number"
        error={errors.salary?.message}
        {...register('salary', {
          required: 'Salary is required',
          min: { value: 0, message: 'Salary must be positive' },
          valueAsNumber: true,
        })}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  )
}

export default EmployeeForm