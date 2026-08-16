import { SHIFT_TYPES } from '../../services/scheduleService'
import { SHIFT_COLORS, DRAG_SHIFT } from './shiftStyles'

function ShiftPalette() {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500 dark:text-gray-400">Drag a shift onto a cell:</span>
      {SHIFT_TYPES.map((shift) => (
        <div
          key={shift}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', DRAG_SHIFT + shift)
            e.dataTransfer.effectAllowed = 'copy'
          }}
          className={`cursor-grab select-none rounded-md px-3 py-1 text-xs font-semibold shadow-sm active:cursor-grabbing ${SHIFT_COLORS[shift]}`}
        >
          {shift}
        </div>
      ))}
    </div>
  )
}

export default ShiftPalette
