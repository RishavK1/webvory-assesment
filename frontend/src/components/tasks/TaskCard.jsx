import { Link } from 'react-router-dom'
import { CalendarClock, MessageSquare } from 'lucide-react'
import { cn } from '../../utils/cn'
import { priorityMeta } from '../../utils/constants'
import { formatDate } from '../../utils/date'
import { Avatar, OverdueBadge, PriorityBadge, StatusBadge } from '../ui'

export function TaskCard({
  task,
  showStatus = false,
  draggable = false,
  onDragStart,
  onDragEnd,
  isDragging = false,
  className,
}) {
  const meta = priorityMeta(task.priority)

  return (
    <Link
      to={`/tasks/${task.id}`}
      draggable={draggable}
      onDragStart={draggable ? (event) => onDragStart?.(event, task) : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
      className={cn(
        'group relative flex flex-col gap-2.5 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs',
        'dark:border-slate-800/80 dark:bg-[#0e131f]',
        draggable && 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-40 scale-95',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <PriorityBadge priority={task.priority} />
          {showStatus && <StatusBadge status={task.status} />}
        </div>
        {task.is_overdue && <OverdueBadge />}
      </div>

      <h3 className="line-clamp-2 text-xs font-bold leading-snug text-slate-900 dark:text-slate-100 font-display">
        {task.title}
      </h3>

      {task.description && (
        <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          {task.description}
        </p>
      )}

      <div className="mt-1 flex items-center justify-between gap-2 border-t border-dashed border-slate-200/80 pt-2.5 dark:border-slate-800/80">
        <Avatar name={task.assignee?.name} size="xs" />

        <div className="flex shrink-0 items-center gap-1.5">
          {task.comment_count > 0 && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              title={`${task.comment_count} notes`}
            >
              <MessageSquare className="h-3 w-3" aria-hidden="true" />
              {task.comment_count}
            </span>
          )}
          {task.due_date && (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                task.is_overdue
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
              )}
            >
              <CalendarClock className="h-3 w-3" aria-hidden="true" />
              {formatDate(task.due_date)}
            </span>
          )}
        </div>
      </div>

      {/* Priority accent top edge stripe */}
      <span
        className={cn('absolute inset-x-4 top-0 h-0.5 rounded-full opacity-80', meta.bar)}
        aria-hidden="true"
      />
    </Link>
  )
}
