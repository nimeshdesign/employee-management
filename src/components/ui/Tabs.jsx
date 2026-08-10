// Controlled component: `value` is owned by the parent, `onChange` is how
// this component asks the parent to update it — same pattern as SearchBar
// and Pagination. tabs: [{ label, value }].
function Tabs({ tabs, value, onChange }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-900">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            value === tab.value
              ? 'bg-white text-primary shadow-sm dark:bg-gray-700 dark:text-white'
              : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export default Tabs
