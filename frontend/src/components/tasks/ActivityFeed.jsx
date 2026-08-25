import { CirclePlus, History, MessageSquareText, RefreshCw, UserCog } from 'lucide-react'
import { EmptyState } from '../ui'
import { priorityMeta, statusMeta } from '../../utils/constants'
import { formatRelative } from '../../utils/date'

const ACTION_META = {
  created: {
    icon: CirclePlus,
    tone: 'text-emerald-600 dark:text-emerald-400',
    chip: 'bg-emerald-50 dark:bg-emerald-950/50',
    verb: 'created this task',
  },
  status_changed: {
    icon: RefreshCw,
    tone: 'text-cyan-600 dark:text-cyan-400',
    chip: 'bg-cyan-50 dark:bg-cyan-950/50',
    verb: 'changed status',
  },
  priority_changed: {
    icon: RefreshCw,
    tone: 'text-amber-600 dark:text-amber-400',
    chip: 'bg-amber-50 dark:bg-amber-950/50',
    verb: 'changed priority',
  },
  reassigned: {
    icon: UserCog,
    tone: 'text-purple-600 dark:text-purple-400',
    chip: 'bg-purple-50 dark:bg-purple-950/50',
    verb: 'reassigned this task',
  },
  commented: {
    icon: MessageSquareText,
    tone: 'text-slate-500 dark:text-slate-400',
    chip: 'bg-slate-100 dark:bg-slate-800',
    verb: 'added a note',
  },
  updated: {
    icon: RefreshCw,
    tone: 'text-slate-500 dark:text-slate-400',
    chip: 'bg-slate-100 dark:bg-slate-800',
    verb: 'updated this task',
  },
}

function readableValue(field, value) {
  if (!value) return null
  if (field === 'status') return statusMeta(value).label
  if (field === 'priority') return priorityMeta(value).label
  return value
}

export function ActivityFeed({ activities, loading = false }) {
  if (loading) {
    return <p className="text-xs text-slate-500 dark:text-slate-400">Loading history…</p>
  }

  if (!activities?.length) {
    return (
      <EmptyState
        icon={History}
        title="No activity recorded"
        message="Changes to this task will appear here."
        className="py-8"
      />
    )
  }

  return (
    <ol className="space-y-1">
      {activities.map((entry, index) => {
        const meta = ACTION_META[entry.action] ?? ACTION_META.updated
        const Icon = meta.icon
        const from = readableValue(entry.field, entry.old_value)
        const to = readableValue(entry.field, entry.new_value)
        const isLast = index === activities.length - 1

        return (
          <li key={entry.id} className="relative flex gap-3 pb-4">
            {!isLast && (
              <span
                className="absolute left-3.5 top-8 h-[calc(100%-1rem)] w-px bg-slate-200 dark:bg-slate-800"
                aria-hidden="true"
              />
            )}

            <span className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${meta.chip} shadow-2xs`}>
              <Icon className={`h-3.5 w-3.5 ${meta.tone}`} aria-hidden="true" />
            </span>

            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-xs text-slate-700 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {entry.user?.name ?? 'Someone'}
                </span>{' '}
                {meta.verb}
                {from && to && (
                  <>
                    {' '}
                    from <span className="font-semibold text-slate-900 dark:text-slate-100">{from}</span> to{' '}
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{to}</span>
                  </>
                )}
                {!from && to && entry.action !== 'created' && (
                  <>
                    {' '}
                    to <span className="font-semibold text-slate-900 dark:text-slate-100">{to}</span>
                  </>
                )}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">{formatRelative(entry.created_at)}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
