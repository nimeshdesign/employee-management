import { FiX } from 'react-icons/fi'

// Unlike Modal, this stays mounted at all times and animates open/closed
// via a CSS transform — necessary for a slide transition to be visible at
// all (Modal just unmounts, which is instant, no transition possible).
// Same isOpen/onClose/title/children API as Modal, so the two are
// interchangeable at the call site depending on which interaction fits.
function Drawer({ isOpen, onClose, title, children }) {
  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? '' : 'pointer-events-none'}`} aria-hidden={!isOpen}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        className={`absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-white shadow-lg transition-transform duration-200 dark:bg-gray-800 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <FiX size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  )
}

export default Drawer
