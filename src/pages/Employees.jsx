import { useState, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FiEdit2, FiTrash2, FiCheck, FiX, FiEye, FiList, FiGrid } from 'react-icons/fi'
import Card from '../components/ui/Card'
import Table from '../components/ui/Table'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import SearchBar from '../components/ui/SearchBar'
import Pagination from '../components/ui/Pagination'
import Modal from '../components/ui/Modal'
import Drawer from '../components/ui/Drawer'
import Loader from '../components/ui/Loader'
import Tabs from '../components/ui/Tabs'
import EmployeeForm from '../components/EmployeeForm'
import EmployeeCard from '../components/EmployeeCard'
import { fetchEmployees, addEmployee, updateEmployee, deleteEmployee } from '../redux/slices/employeeSlice'
import { useDebounce } from '../hooks/useDebounce'
import { DEPARTMENTS } from '../services/employeeExtras'
import { INLINE_INPUT_CLASS } from '../utils/constants'

const PAGE_SIZE = 7

// 'All' plus one tab per department — built once, outside the component,
// since DEPARTMENTS is a static import, not derived from state or props.
const DEPARTMENT_TABS = [
  { label: 'All', value: 'All' },
  ...DEPARTMENTS.map((dept) => ({ label: dept, value: dept })),
]

function Employees() {
  const dispatch = useDispatch()
  const { items: employees, status, error } = useSelector((state) => state.employees)
  const isLoading = status === 'idle' || status === 'loading'

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchEmployees())
    }
  }, [status, dispatch])

  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [departmentFilter, setDepartmentFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState('table') // 'table' | 'grid'
  // { key, direction: 'asc' | 'desc' } | null — Table only ever reads this
  // to draw an indicator; the actual sorting happens below in `filtered`.
  const [sortConfig, setSortConfig] = useState(null)

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [viewTarget, setViewTarget] = useState(null)

  // editingId: which row is currently in edit mode (null = none — only one
  // row editable at a time, in either view). editDraft: that row's
  // in-progress values, seeded from the row when editing starts, discarded
  // on Cancel, sent to Redux on Save.
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState(null)

  const filtered = useMemo(() => {
    const result = employees.filter((emp) => {
      const matchesSearch = emp.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      const matchesDepartment = departmentFilter === 'All' || emp.department === departmentFilter
      return matchesSearch && matchesDepartment
    })

    if (!sortConfig) return result

    // .sort() mutates in place, so we sort a copy — mutating `result`
    // (itself already a fresh array from .filter()) would be safe too,
    // but copying first is the habit that stays safe even if this logic
    // moves somewhere `result` isn't guaranteed to be a fresh array.
    return [...result].sort((a, b) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [employees, debouncedSearchTerm, departmentFilter, sortConfig])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE)

  function handleSearchChange(value) {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  function handleDepartmentChange(value) {
    setDepartmentFilter(value)
    setCurrentPage(1) // same reason as search: don't leave the user stranded on a now-empty page
  }

  // Three-state cycle per column: unsorted -> asc -> desc -> unsorted.
  // Clicking a DIFFERENT column always starts that column at 'asc'.
  function handleSort(key) {
    setSortConfig((prev) => {
      if (prev?.key !== key) return { key, direction: 'asc' }
      if (prev.direction === 'asc') return { key, direction: 'desc' }
      return null
    })
  }

  function handleAddSubmit(formData) {
    dispatch(addEmployee(formData))
    setIsAddModalOpen(false)
    setCurrentPage(1) // the new employee lands at the front of the list (see employeeSlice) — jump there
  }

  function handleConfirmDelete() {
    dispatch(deleteEmployee(deleteTarget.id))
    setDeleteTarget(null)
  }

  function startEdit(row) {
    setEditingId(row.id)
    setEditDraft(row) // seed the draft with the row's current values
  }

  function cancelEdit() {
    setEditingId(null)
    setEditDraft(null)
  }

  function saveEdit() {
    dispatch(updateEmployee({ id: editingId, formData: editDraft }))
    cancelEdit()
  }

  function updateDraftField(field, value) {
    setEditDraft((prev) => ({ ...prev, [field]: value }))
  }

  // Not wrapped in useMemo here — editDraft changes every keystroke while
  // editing, so a memoized array would recompute on nearly every render
  // anyway. Phase 11's memoization paid off for stable data; it wouldn't
  // here, since the underlying value genuinely changes constantly during
  // an edit.
  const columns = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (row) =>
        row.id === editingId ? (
          <input
            className={INLINE_INPUT_CLASS}
            value={editDraft.name}
            onChange={(e) => updateDraftField('name', e.target.value)}
          />
        ) : (
          row.name
        ),
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (row) =>
        row.id === editingId ? (
          <input
            type="email"
            className={INLINE_INPUT_CLASS}
            value={editDraft.email}
            onChange={(e) => updateDraftField('email', e.target.value)}
          />
        ) : (
          row.email
        ),
    },
    {
      key: 'department',
      header: 'Department',
      sortable: true,
      render: (row) =>
        row.id === editingId ? (
          <select
            className={INLINE_INPUT_CLASS}
            value={editDraft.department}
            onChange={(e) => updateDraftField('department', e.target.value)}
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        ) : (
          row.department
        ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) =>
        row.id === editingId ? (
          <select
            className={INLINE_INPUT_CLASS}
            value={editDraft.status}
            onChange={(e) => updateDraftField('status', e.target.value)}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        ) : (
          <Badge color={row.status === 'active' ? 'accent' : 'gray'}>{row.status}</Badge>
        ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => {
        if (row.id === editingId) {
          return (
            <div className="flex gap-3">
              <button onClick={saveEdit} aria-label="Save" className="text-accent hover:text-emerald-700">
                <FiCheck size={16} />
              </button>
              <button onClick={cancelEdit} aria-label="Cancel" className="text-gray-400 hover:text-gray-600">
                <FiX size={16} />
              </button>
            </div>
          )
        }

        // Disabled (not hidden) while a different row is being edited —
        // editDraft only holds one row's data, so editing two rows at
        // once isn't something this state shape supports.
        const disabled = editingId !== null
        return (
          <div className="flex gap-3">
            <button
              onClick={() => setViewTarget(row)}
              aria-label={`View ${row.name}`}
              className="text-gray-400 hover:text-primary"
            >
              <FiEye size={16} />
            </button>
            <button
              onClick={() => startEdit(row)}
              disabled={disabled}
              aria-label={`Edit ${row.name}`}
              className="text-gray-400 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
            >
              <FiEdit2 size={16} />
            </button>
            <button
              onClick={() => setDeleteTarget(row)}
              disabled={disabled}
              aria-label={`Delete ${row.name}`}
              className="text-gray-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Employees</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>Add Employee</Button>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Tabs tabs={DEPARTMENT_TABS} value={departmentFilter} onChange={handleDepartmentChange} />

          {/* View mode toggle — same controlled pattern as everything else
              on this page: state lives here, the buttons just report clicks. */}
          <div className="inline-flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-900">
            <button
              onClick={() => setViewMode('table')}
              aria-label="Table view"
              className={`rounded-md p-1.5 ${
                viewMode === 'table'
                  ? 'bg-white text-primary shadow-sm dark:bg-gray-700 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <FiList size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              className={`rounded-md p-1.5 ${
                viewMode === 'grid'
                  ? 'bg-white text-primary shadow-sm dark:bg-gray-700 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <FiGrid size={16} />
            </button>
          </div>
        </div>

        <div className="mb-4 max-w-sm">
          <SearchBar value={searchTerm} onChange={handleSearchChange} placeholder="Search by name..." />
        </div>

        {isLoading && (
          <div className="flex justify-center py-10">
            <Loader />
          </div>
        )}

        {error && !isLoading && (
          <p className="py-4 text-sm text-red-600">
            {error} — for adding/editing, check your GoRest token in .env.
          </p>
        )}

        {!isLoading && viewMode === 'table' && (
          <Table columns={columns} data={pageItems} sortConfig={sortConfig} onSort={handleSort} />
        )}

        {!isLoading && viewMode === 'grid' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((emp) => (
              <EmployeeCard
                key={emp.id}
                employee={emp}
                isEditing={emp.id === editingId}
                editDraft={editDraft}
                onFieldChange={updateDraftField}
                onStartEdit={() => startEdit(emp)}
                onSave={saveEdit}
                onCancel={cancelEdit}
                onDelete={() => setDeleteTarget(emp)}
                onView={() => setViewTarget(emp)}
                editDisabled={editingId !== null && editingId !== emp.id}
              />
            ))}
          </div>
        )}

        {!isLoading && (
          <div className="mt-4">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </Card>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Employee">
        <EmployeeForm
          defaultValues={{
            gender: 'male',
            status: 'active',
            department: 'Engineering',
            position: 'Associate',
          }}
          onSubmit={handleAddSubmit}
          onCancel={() => setIsAddModalOpen(false)}
          submitLabel="Add"
        />
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Employee">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This can&apos;t be
          undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </div>
      </Modal>

      <Drawer isOpen={!!viewTarget} onClose={() => setViewTarget(null)} title="Employee Details">
        {viewTarget && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Avatar name={viewTarget.name} size="lg" />
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-100">{viewTarget.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{viewTarget.email}</p>
              </div>
            </div>

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
                <dt className="text-gray-500 dark:text-gray-400">Department</dt>
                <dd className="text-gray-800 dark:text-gray-100">{viewTarget.department}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
                <dt className="text-gray-500 dark:text-gray-400">Position</dt>
                <dd className="text-gray-800 dark:text-gray-100">{viewTarget.position}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
                <dt className="text-gray-500 dark:text-gray-400">Salary</dt>
                <dd className="text-gray-800 dark:text-gray-100">
                  ${viewTarget.salary?.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
                <dt className="text-gray-500 dark:text-gray-400">Gender</dt>
                <dd className="capitalize text-gray-800 dark:text-gray-100">{viewTarget.gender}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Status</dt>
                <dd>
                  <Badge color={viewTarget.status === 'active' ? 'accent' : 'gray'}>
                    {viewTarget.status}
                  </Badge>
                </dd>
              </div>
            </dl>
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default Employees
