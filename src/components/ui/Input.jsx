import { forwardRef } from 'react'

// forwardRef lets a parent attach a ref that lands on the actual <input>
// DOM node, not on this wrapper component. We need this later so React
// Hook Form's register() can hook directly into the input.
const Input = forwardRef(function Input({ label, id, error, className = '', ...rest }, ref) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        className={`rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 dark:bg-gray-900 dark:text-gray-100 ${
          error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
        } ${className}`}
        {...rest}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
})

export default Input
