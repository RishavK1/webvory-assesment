import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Search } from 'lucide-react'
import { Button } from '../ui'
import { Logomark } from './Sidebar'

export function Topbar({ onMenuClick, title }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  function handleSearch(event) {
    event.preventDefault()
    const trimmed = query.trim()
    navigate(trimmed ? `/tasks?search=${encodeURIComponent(trimmed)}` : '/tasks')
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 sm:h-16 items-center gap-2 sm:gap-3 border-b border-slate-200/90 bg-white/80 px-3 sm:px-8 backdrop-blur-xl dark:border-slate-800/80 dark:bg-[#070a11]/80">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="lg:hidden shrink-0 h-8 w-8"
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.8} />
      </Button>

      <Logomark className="lg:hidden shrink-0" />

      {/* Breadcrumb section */}
      <div className="hidden min-w-0 flex-1 items-center gap-2 sm:flex">
        <div className="flex items-center gap-1.5 rounded-lg bg-slate-100/80 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Webvory</span>
        </div>
        <span className="text-slate-300 dark:text-slate-700">/</span>
        <h1 className="truncate text-sm font-bold text-slate-900 dark:text-slate-100 font-display">{title}</h1>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="ml-auto w-full max-w-[160px] xs:max-w-[220px] sm:max-w-[300px]">
        <label className="relative block">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tasks…"
            aria-label="Search tasks"
            className="block w-full rounded-xl border border-slate-200/90 bg-slate-50/80 py-1.5 sm:py-2 pl-8.5 sm:pl-9.5 pr-3 sm:pr-9 text-xs text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-hidden focus:ring-3 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-400 dark:focus:bg-slate-900"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500 hidden sm:inline-block">
            /
          </kbd>
        </label>
      </form>
    </header>
  )
}
