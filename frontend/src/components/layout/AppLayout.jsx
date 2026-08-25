import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

const TITLES = [
  [/^\/$/, 'Command Center'],
  [/^\/tasks\/\d+$/, 'Task Details'],
  [/^\/tasks/, 'Tasks Overview'],
  [/^\/board/, 'Kanban Board'],
  [/^\/team/, 'Team Directory'],
  [/^\/directory/, 'External Staff'],
]

function titleFor(pathname) {
  return TITLES.find(([pattern]) => pattern.test(pathname))?.[1] ?? 'Webvory'
}

/** Shell shared by every authenticated page: sidebar, topbar, content slot. */
export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()

  // The mobile drawer must not stay open across a navigation.
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-50 dark:bg-[#070a11]">
      <div className="ambient-mesh pointer-events-none fixed inset-0 hidden dark:block" aria-hidden="true" />
      <div className="ambient-dots pointer-events-none fixed inset-0 opacity-40" aria-hidden="true" />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <Topbar onMenuClick={() => setSidebarOpen(true)} title={titleFor(pathname)} />
        <main className="relative mx-auto max-w-[1600px] px-3.5 py-4 sm:px-8 sm:py-6 lg:px-10 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
