const COLORS = {
  primary: 'bg-blue-100 text-primary dark:bg-blue-900/40 dark:text-blue-300',
  accent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  gray: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

function Badge({ children, color = 'gray' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${COLORS[color]}`}>
      {children}
    </span>
  )
}

export default Badge
