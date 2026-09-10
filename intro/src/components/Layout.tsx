import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import Footer from './Footer'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1)
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      }, 60)
    } else {
      window.scrollTo({ top: 0 })
    }
  }, [location.pathname, location.hash])

  return (
    <div className="flex min-h-screen flex-col bg-wash">
      <Navbar onMenuToggle={() => setSidebarOpen(true)} />

      <div className="flex flex-1 flex-col lg:flex-row">
        {!isHome && (
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}

        <main className="w-full min-w-0 flex-1">
          {isHome ? (
            <div>
              <Outlet />
            </div>
          ) : (
            <div className="px-4 py-12 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          )}
          <Footer />
        </main>
      </div>
    </div>
  )
}