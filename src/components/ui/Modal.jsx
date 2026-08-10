import { FiX } from 'react-icons/fi'

// isOpen/onClose are owned by whichever parent opens this modal (e.g. the
// Employees page holding `const [isModalOpen, setIsModalOpen] = useState(false)`).
// Note: a production version would render this through a React Portal
// (createPortal) into document.body, so it can't get visually clipped by
// an ancestor's `overflow: hidden`. Skipped here to keep things simple —
// worth revisiting once you hit a real clipping bug.
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <FiX size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default Modal
