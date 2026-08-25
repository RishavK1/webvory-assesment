import { useState } from 'react'
import { AlertTriangle, ChevronDown, ListFilter, Search, X } from 'lucide-react'
import { Button, Input, Select } from '../ui'
import { SORT_OPTIONS, TASK_PRIORITIES, TASK_STATUSES } from '../../utils/constants'
import { cn } from '../../utils/cn'

export function TaskFilters({ filters, onChange, onReset, users = [], resultCount }) {
  const [expanded, setExpanded] = useState(() =>
    Boolean(filters.assignee || filters.overdue || (filters.sort_by && filters.sort_by !== 'created_at')),
  )

  const update = (key) => (event) => {
    const value = event.target.value
    onChange({ [key]: value === '' ? undefined : value })
  }

  const hasActiveFilters = Boolean(
    filters.search || filters.status || filters.priority || filters.assignee || filters.overdue,
  )
  const moreActive = Boolean(
    filters.assignee || filters.overdue || (filters.sort_by && filters.sort_by !== 'created_at'),
  )

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white/90 shadow-xs backdrop-blur-md dark:border-slate-800/80 dark:bg-[#0e131f]/90">
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 p-3 sm:p-3.5">
        <Input
          aria-label="Search tasks"
          icon={Search}
          placeholder="Filter tasks…"
          value={filters.search ?? ''}
          onChange={update('search')}
          containerClassName="w-full sm:w-auto sm:min-w-[200px] flex-1 sm:max-w-xs"
        />

        <Select
          aria-label="Filter by status"
          value={filters.status ?? ''}
          onChange={update('status')}
          placeholder="All Statuses"
          options={TASK_STATUSES.map(({ value, label }) => ({ value, label }))}
          containerClassName="w-full sm:w-auto sm:min-w-[9.5rem] flex-1"
        />

        <Select
          aria-label="Filter by priority"
          value={filters.priority ?? ''}
          onChange={update('priority')}
          placeholder="All Priorities"
          options={TASK_PRIORITIES.map(({ value, label }) => ({ value, label }))}
          containerClassName="w-full sm:w-auto sm:min-w-[9.5rem] flex-1"
        />

        <Button
          variant={moreActive ? 'subtle' : 'secondary'}
          icon={ListFilter}
          iconRight={ChevronDown}
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className={cn(expanded && !moreActive && 'border-emerald-300 dark:border-emerald-700/50')}
        >
          Options
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" icon={X} onClick={onReset} className="text-rose-600 dark:text-rose-400">
            Reset
          </Button>
        )}

        {resultCount !== undefined && (
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-slate-100/80 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{resultCount}</span>
            <span>{resultCount === 1 ? 'task' : 'tasks'}</span>
          </span>
        )}
      </div>

      {expanded && (
        <div className="flex flex-wrap items-end gap-3.5 border-t border-slate-100 p-3.5 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
          <Select
            label="Assignee"
            value={filters.assignee ?? ''}
            onChange={update('assignee')}
            placeholder="All Team Members"
            options={users.map((user) => ({ value: String(user.id), label: user.name }))}
            containerClassName="w-auto min-w-[12rem]"
          />

          <Select
            label="Sort by"
            value={filters.sort_by ?? 'created_at'}
            onChange={update('sort_by')}
            options={SORT_OPTIONS}
            containerClassName="w-auto min-w-[12rem]"
          />

          <button
            type="button"
            onClick={() => onChange({ overdue: filters.overdue === 'true' ? undefined : 'true' })}
            aria-pressed={filters.overdue === 'true'}
            className={cn(
              'inline-flex h-9.5 cursor-pointer shrink-0 items-center gap-1.5 rounded-xl px-4 text-xs font-bold transition-all shadow-xs',
              filters.overdue === 'true'
                ? 'bg-rose-600 text-white shadow-rose-600/25'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800',
            )}
          >
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            Overdue Only
          </button>
        </div>
      )}
    </div>
  )
}
