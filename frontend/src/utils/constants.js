export const TASK_STATUSES = [
  {
    value: 'pending',
    label: 'Pending',
    badge: 'bg-slate-100 text-slate-700 ring-slate-400/25 dark:bg-slate-800/60 dark:text-slate-300 dark:ring-slate-700/60',
    dot: 'bg-slate-400 dark:bg-slate-500',
    accent: 'bg-slate-400 dark:bg-slate-500',
    hex: { light: '#64748b', dark: '#94a3b8' },
  },
  {
    value: 'in_progress',
    label: 'In Progress',
    badge: 'bg-cyan-50 text-cyan-700 ring-cyan-600/25 dark:bg-cyan-950/50 dark:text-cyan-300 dark:ring-cyan-500/30',
    dot: 'bg-cyan-500',
    accent: 'bg-cyan-500 dark:bg-cyan-400',
    hex: { light: '#0891b2', dark: '#22d3ee' },
  },
  {
    value: 'completed',
    label: 'Completed',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/25 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-500/30',
    dot: 'bg-emerald-500',
    accent: 'bg-emerald-500 dark:bg-emerald-400',
    hex: { light: '#059669', dark: '#34d399' },
  },
  {
    value: 'blocked',
    label: 'Blocked',
    badge: 'bg-rose-50 text-rose-700 ring-rose-600/25 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-500/30',
    dot: 'bg-rose-500',
    accent: 'bg-rose-500 dark:bg-rose-400',
    hex: { light: '#e11d48', dark: '#fb7185' },
  },
]

export const TASK_PRIORITIES = [
  {
    value: 'low',
    label: 'Low',
    badge: 'bg-slate-100 text-slate-600 ring-slate-400/20 dark:bg-slate-800/60 dark:text-slate-400 dark:ring-slate-700/50',
    bar: 'bg-slate-400 dark:bg-slate-600',
    hex: { light: '#94a3b8', dark: '#64748b' },
  },
  {
    value: 'medium',
    label: 'Medium',
    badge: 'bg-blue-50 text-blue-700 ring-blue-600/25 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-500/30',
    bar: 'bg-blue-500 dark:bg-blue-400',
    hex: { light: '#2563eb', dark: '#60a5fa' },
  },
  {
    value: 'high',
    label: 'High',
    badge: 'bg-amber-50 text-amber-700 ring-amber-600/25 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-500/30',
    bar: 'bg-amber-500 dark:bg-amber-400',
    hex: { light: '#d97706', dark: '#fbbf24' },
  },
  {
    value: 'urgent',
    label: 'Urgent',
    badge: 'bg-purple-50 text-purple-700 ring-purple-600/25 dark:bg-purple-950/50 dark:text-purple-300 dark:ring-purple-500/30',
    bar: 'bg-purple-500 dark:bg-purple-400',
    hex: { light: '#9333ea', dark: '#c084fc' },
  },
]

export const USER_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'member', label: 'Member' },
]

export const SORT_OPTIONS = [
  { value: 'created_at', label: 'Created date' },
  { value: 'updated_at', label: 'Last updated' },
  { value: 'due_date', label: 'Due date' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
  { value: 'title', label: 'Title' },
]

export const PAGE_SIZES = [10, 20, 50]

const byValue = (list) => Object.fromEntries(list.map((item) => [item.value, item]))

export const STATUS_MAP = byValue(TASK_STATUSES)
export const PRIORITY_MAP = byValue(TASK_PRIORITIES)
export const ROLE_MAP = byValue(USER_ROLES)

export const statusMeta = (value) => STATUS_MAP[value] ?? TASK_STATUSES[0]
export const priorityMeta = (value) => PRIORITY_MAP[value] ?? TASK_PRIORITIES[0]
