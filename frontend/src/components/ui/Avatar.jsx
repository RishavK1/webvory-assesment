import { cn } from '../../utils/cn'

// Fixed palette indexed by a hash of the name, so a given person keeps the
// same colour on every screen instead of changing between renders.
const COLORS = [
  'bg-emerald-600',
  'bg-teal-600',
  'bg-cyan-600',
  'bg-blue-600',
  'bg-indigo-600',
  'bg-purple-600',
  'bg-amber-600',
  'bg-rose-600',
]

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
}

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function colorFor(name = '') {
  let hash = 0
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return COLORS[hash % COLORS.length]
}

export function Avatar({ name, size = 'md', className }) {
  const label = name || 'Unassigned'
  return (
    <span
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        name ? colorFor(name) : 'bg-zinc-300 dark:bg-zinc-700',
        SIZES[size],
        className,
      )}
    >
      {name ? initials(name) : '—'}
    </span>
  )
}

/** Name + avatar, or a clear "Unassigned" state when there is no assignee. */
export function UserChip({ user, size = 'sm', className }) {
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-2', className)}>
      <Avatar name={user?.name} size={size} />
      <span
        className={cn(
          'truncate text-sm',
          user ? 'text-zinc-700 dark:text-zinc-300' : 'italic text-zinc-400 dark:text-zinc-500',
        )}
      >
        {user?.name ?? 'Unassigned'}
      </span>
    </span>
  )
}
