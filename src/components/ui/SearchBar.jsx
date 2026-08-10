import { FiSearch } from 'react-icons/fi'

// Controlled input: `value` comes from the parent's state, `onChange`
// reports keystrokes back up — the parent (not this component) owns
// the search text. We'll wire the parent's useState in Phase 4.
function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative">
      <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
      />
    </div>
  )
}

export default SearchBar
