import { NavLink, useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  Compass,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Moon,
  Sun,
  Users2,
  X,
} from 'lucide-react'
import { cn } from '../../utils/cn'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../hooks/useTheme'
import { ROLE_MAP } from '../../utils/constants'
import { Avatar, Button } from '../ui'

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Command Center', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Workspace',
    items: [
      { to: '/tasks', label: 'All Tasks', icon: ListTodo },
      { to: '/board', label: 'Kanban Board', icon: FolderKanban },
    ],
  },
  {
    label: 'Organization',
    items: [
      { to: '/team', label: 'Team Members', icon: Users2 },
      { to: '/directory', label: 'Staff Directory', icon: Compass },
    ],
  },
]

export function Logomark({ className }) {
  return (
    <div
      className={cn(
        'relative flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-xl',
        'bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 shadow-md shadow-emerald-950/20 ring-1 ring-white/20',
        className,
      )}
      aria-hidden="true"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4v16" />
        <path d="M4 12l10-8" />
        <path d="M4 12l10 8" />
        <path d="M14 6h6" />
        <path d="M14 12h4" />
        <path d="M14 18h6" />
      </svg>
    </div>
  )
}

export function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const { isDark, toggle } = useTheme()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200/90 bg-white/95 backdrop-blur-xl',
          'transition-transform duration-200 lg:translate-x-0',
          'dark:border-slate-800/80 dark:bg-[#090d16]/95',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-slate-100 px-5 dark:border-slate-800/60">
          <div className="flex min-w-0 items-center gap-3">
            <Logomark />
            <div className="min-w-0 leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
                  Webvory
                </span>
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 font-display">
                Workspace
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden" aria-label="Close menu">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3.5 pt-4 pb-4" aria-label="Main Navigation">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 font-display">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150',
                        isActive
                          ? 'bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent text-emerald-700 font-semibold shadow-xs dark:from-emerald-500/15 dark:to-transparent dark:text-emerald-300'
                          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-100',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                              isActive
                                ? 'bg-emerald-500 text-white shadow-xs dark:bg-emerald-500'
                                : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/80 group-hover:text-slate-800 dark:bg-slate-800/80 dark:text-slate-400 dark:group-hover:bg-slate-800 dark:group-hover:text-slate-200',
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.9} aria-hidden="true" />
                          </span>
                          <span>{label}</span>
                        </div>
                        {isActive ? (
                          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-slate-600" />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User Card & Settings Dock */}
        <div className="border-t border-slate-100 p-3.5 dark:border-slate-800/70 bg-slate-50/50 dark:bg-[#0b0f19]/60">
          <div className="flex items-center gap-3 rounded-xl p-2 transition-colors">
            <div className="relative">
              <Avatar name={user?.name} size="md" />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100 font-display">
                {user?.name}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="inline-block rounded-md bg-emerald-100/80 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  {ROLE_MAP[user?.role]?.label ?? user?.role}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={toggle}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200/80 bg-white py-1.5 text-xs font-semibold text-slate-600 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="h-3.5 w-3.5 text-amber-400" strokeWidth={2} /> : <Moon className="h-3.5 w-3.5 text-indigo-500" strokeWidth={2} />}
              {isDark ? 'Light' : 'Dark'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200/80 bg-white py-1.5 text-xs font-semibold text-slate-600 shadow-xs transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-rose-900/50 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.8} />
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
