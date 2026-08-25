import { cn } from '../../utils/cn'
import { priorityMeta, statusMeta } from '../../utils/constants'

/** Generic pill. StatusBadge and PriorityBadge build on this. */
export function Badge({ children, className, dot }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        'ring-1 ring-inset whitespace-nowrap',
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dot)} aria-hidden="true" />}
      {children}
    </span>
  )
}

/** Colour and label come from utils/constants, never from inline strings. */
export function StatusBadge({ status, showDot = true }) {
  const meta = statusMeta(status)
  return (
    <Badge className={meta.badge} dot={showDot ? meta.dot : undefined}>
      {meta.label}
    </Badge>
  )
}

export function PriorityBadge({ priority }) {
  const meta = priorityMeta(priority)
  return <Badge className={meta.badge}>{meta.label}</Badge>
}

export function OverdueBadge() {
  return (
    <Badge
      dot="bg-rose-500"
      className="bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20"
    >
      Overdue
    </Badge>
  )
}
