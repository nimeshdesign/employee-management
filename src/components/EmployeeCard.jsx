import { FiEdit2, FiTrash2, FiCheck, FiX, FiEye } from 'react-icons/fi'
import Card from './ui/Card'
import Avatar from './ui/Avatar'
import Badge from './ui/Badge'
import { DEPARTMENTS } from '../services/employeeExtras'
import { INLINE_INPUT_CLASS } from '../utils/constants'

// isEditing/editDraft come from the SAME state Employees.jsx uses for the
// table's inline editing — grid view and table view are just two different
// renderings of the same underlying edit state, not two separate features.
function EmployeeCard({
  employee,
  isEditing,
  editDraft,
  onFieldChange,
  onStartEdit,
  onSave,
  onCancel,
  onDelete,
  onView,
  editDisabled,
}) {
  if (isEditing) {
    return (
      <Card className="space-y-2">
        <input
          className={INLINE_INPUT_CLASS}
          value={editDraft.name}
          onChange={(e) => onFieldChange('name', e.target.value)}
        />
        <input
          type="email"
          className={INLINE_INPUT_CLASS}
          value={editDraft.email}
          onChange={(e) => onFieldChange('email', e.target.value)}
        />
        <select
          className={INLINE_INPUT_CLASS}
          value={editDraft.department}
          onChange={(e) => onFieldChange('department', e.target.value)}
        >
          {DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
        <select
          className={INLINE_INPUT_CLASS}
          value={editDraft.status}
          onChange={(e) => onFieldChange('status', e.target.value)}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <div className="flex justify-end gap-3 pt-1">
          <button onClick={onSave} aria-label="Save" className="text-accent hover:text-emerald-700">
            <FiCheck size={16} />
          </button>
          <button onClick={onCancel} aria-label="Cancel" className="text-gray-400 hover:text-gray-600">
            <FiX size={16} />
          </button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Avatar name={employee.name} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-gray-800 dark:text-gray-100">{employee.name}</p>
          <p className="truncate text-sm text-gray-500 dark:text-gray-400">{employee.email}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-300">{employee.department}</span>
        <Badge color={employee.status === 'active' ? 'accent' : 'gray'}>{employee.status}</Badge>
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-100 pt-3 dark:border-gray-700">
        <button onClick={onView} aria-label={`View ${employee.name}`} className="text-gray-400 hover:text-primary">
          <FiEye size={16} />
        </button>
        <button
          onClick={onStartEdit}
          disabled={editDisabled}
          aria-label={`Edit ${employee.name}`}
          className="text-gray-400 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
        >
          <FiEdit2 size={16} />
        </button>
        <button
          onClick={onDelete}
          disabled={editDisabled}
          aria-label={`Delete ${employee.name}`}
          className="text-gray-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <FiTrash2 size={16} />
        </button>
      </div>
    </Card>
  )
}

export default EmployeeCard
