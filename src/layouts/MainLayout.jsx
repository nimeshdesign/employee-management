import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'

// isSidebarOpen lives here — the closest common parent of Navbar (which
// needs to *toggle* it) and Sidebar (which needs to *read* it). Neither
// child owns this state; it's "lifted up" and passed down as props.
function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Backdrop: only rendered on mobile while the drawer is open, tapping it closes the drawer */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}

      {/* min-w-0 is load-bearing: a flex child defaults to min-width:auto,
          meaning it refuses to shrink below its content. A page with a wide
          table (the schedule grid) would push this column wider than the
          viewport, scrolling the whole document sideways instead of
          scrolling inside its own container. */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Functional update form: (prev) => !prev, not isSidebarOpen ? ... —
            guarantees we're always flipping the latest value, not one
            captured in a stale closure from an earlier render. */}
        <Navbar onMenuClick={() => setIsSidebarOpen((prev) => !prev)} />
        <main className="min-w-0 flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout