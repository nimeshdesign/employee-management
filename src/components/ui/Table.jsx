import { memo } from 'react'
import { FiChevronUp, FiChevronDown } from 'react-icons/fi'

// Generic table driven entirely by props:
//   columns: [{ key, header, render?, sortable? }] — render customizes a
//            cell; sortable adds a clickable header with a sort indicator.
//   data:    array of row objects — already filtered/sorted by the caller.
//   keyField: which field is unique, used as React's `key` for the row list
//   sortConfig: { key, direction } | null — which column is active, purely
//               for drawing the indicator. Table doesn't sort anything itself.
//   onSort: (key) => void — called when a sortable header is clicked; the
//           caller owns what "clicking it" actually means (asc/desc/none).
function Table({ columns, data, keyField = 'id', sortConfig, onSort }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                {col.sortable ? (
                  <button
                    onClick={() => onSort(col.key)}
                    className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    {col.header}
                    <span className="flex flex-col -space-y-1">
                      <FiChevronUp
                        size={12}
                        className={
                          sortConfig?.key === col.key && sortConfig.direction === 'asc'
                            ? 'text-primary'
                            : 'text-gray-300 dark:text-gray-600'
                        }
                      />
                      <FiChevronDown
                        size={12}
                        className={
                          sortConfig?.key === col.key && sortConfig.direction === 'desc'
                            ? 'text-primary'
                            : 'text-gray-300 dark:text-gray-600'
                        }
                      />
                    </span>
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row[keyField]}
              className="border-b border-gray-100 last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-700/40"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-gray-700 dark:text-gray-200">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// React.memo skips re-rendering Table if props are all shallow-equal to
// last render — but ONLY pays off if the parent passes stable references,
// which is what the useMemo/useCallback changes in Employees.jsx are for.
export default memo(Table)
