import { memo } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import Button from './Button'

// currentPage/totalPages are owned by the parent (pagination state lives
// there); onPageChange is how this component asks the parent to update it.
function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <FiChevronLeft />
      </Button>

      <span className="px-2 text-sm text-gray-600 dark:text-gray-300">
        Page {currentPage} of {totalPages}
      </span>

      <Button
        variant="secondary"
        size="sm"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <FiChevronRight />
      </Button>
    </div>
  )
}

// Cheap and safe to memoize: all props are primitives (numbers) except
// onPageChange, which Employees.jsx passes as `setCurrentPage` directly —
// a useState setter, which React guarantees is stable across renders
// without needing useCallback.
export default memo(Pagination)
