// Constants shared by the palette, the grid and the cells. They live in
// their own module (not alongside a component) so every file that needs
// them can import without dragging a component along — and so Fast
// Refresh keeps working, which it doesn't for files mixing components
// with other exports.

// The drag payload is plain text stuffed into `dataTransfer`. Two kinds
// of drag exist in this feature, so the payload starts with a tag saying
// which one it is:
//   "shift:Morning"        — a chip from the palette (assign)
//   "cell:12_2026-08-14"   — an existing assignment in the grid (move)
export const DRAG_SHIFT = 'shift:'
export const DRAG_CELL = 'cell:'

// Every grid row is forced to exactly this height so a row's vertical
// position is pure arithmetic: row N starts at N * ROW_HEIGHT. Row
// virtualization depends on answering "which rows are on screen?" without
// measuring anything, which only works if the answer is calculable.
// Shared here rather than in RosterGrid so the grid and its rows don't
// have to import from each other in a cycle.
export const ROW_HEIGHT = 40

// Toolbar selects/inputs. Deliberately NOT the shared INLINE_INPUT_CLASS:
// that one is `w-full` for table inline-editing, and appending `w-auto`
// doesn't reliably win — same specificity, so whichever Tailwind emits
// last takes effect, which stretched every control to the full row.
export const CONTROL_CLASS =
  'rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-primary/50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100'

// One background colour per shift type. Empty (unassigned) cells get no
// colour at all, so a blank cell reads as "nobody scheduled".
export const SHIFT_COLORS = {
  Morning: 'bg-amber-200 text-amber-900 dark:bg-amber-700 dark:text-amber-50',
  Afternoon: 'bg-sky-200 text-sky-900 dark:bg-sky-700 dark:text-sky-50',
  Night: 'bg-indigo-300 text-indigo-950 dark:bg-indigo-700 dark:text-indigo-50',
  Off: 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-200',
}

// Visual treatment per conflict type — a coloured ring drawn INSIDE the
// cell (ring-inset) so it doesn't get clipped by neighbouring cells.
export const CONFLICT_STYLES = {
  double: 'ring-2 ring-inset ring-red-500',
  understaffed: 'ring-2 ring-inset ring-orange-400',
}
