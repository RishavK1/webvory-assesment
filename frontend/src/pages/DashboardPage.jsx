import { useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  ListTodo,
  OctagonX,
  Search,
  Timer,
} from 'lucide-react'
import { dashboardService } from '../services/dashboardService'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../hooks/useTheme'
import { TASK_PRIORITIES, statusMeta } from '../utils/constants'
import { formatDate } from '../utils/date'
import { cn } from '../utils/cn'
import {
  Avatar,
  DonutChart,
  ChartFrame,
  ErrorState,
  Legend,
  LoadingState,
  PriorityBadge,
  SERIES_COLORS,
  StatCard,
  TrendChart,
  UserChip,
  pick,
} from '../components/ui'

const DONUT_ORDER = ['completed', 'in_progress', 'blocked', 'pending']

/** Simple spring-driven fade/slide — no blur filters, no bespoke bezier. */
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
}

const stagger = { show: { transition: { staggerChildren: 0.05 } } }

function Panel({ children, className, ...rest }) {
  return (
    <motion.section
      variants={fadeUp}
      // `min-w-0` keeps a grid item free to shrink below its content's
      // min-content width, otherwise narrow columns force a sideways scroll.
      className={cn('app-panel min-w-0 overflow-hidden rounded-xl p-5 sm:p-6', className)}
      {...rest}
    >
      {children}
    </motion.section>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const navigate = useNavigate()

  const fetchDashboard = useCallback((options) => dashboardService.get(options), [])
  const { data, error, loading, refetch } = useAsync(fetchDashboard, [])

  const donutSegments = useMemo(() => {
    if (!data) return []
    return DONUT_ORDER.map((value) => {
      const meta = statusMeta(value)
      return {
        key: value,
        label: meta.label,
        value: data.by_status[value] ?? 0,
        color: pick(meta.hex, isDark),
      }
    })
  }, [data, isDark])

  const prioritySeries = useMemo(() => {
    if (!data) return []
    // Reversed so the most severe sits at the top, where the eye lands first.
    return [...TASK_PRIORITIES].reverse().map((priority) => ({
      key: priority.value,
      label: priority.label,
      value: data.by_priority[priority.value] ?? 0,
      color: pick(priority.hex, isDark),
    }))
  }, [data, isDark])

  if (loading && !data) return <LoadingState label="Loading dashboard…" />
  if (error) return <ErrorState error={error} onRetry={refetch} />
  if (!data) return null

  const trendTotals = data.trend.reduce(
    (acc, point) => ({
      created: acc.created + point.created,
      completed: acc.completed + point.completed,
    }),
    { created: 0, completed: 0 },
  )

  const workload = data.workload.slice(0, 6).map((entry) => ({
    key: entry.user_id,
    label: entry.name,
    value: entry.total,
    note: entry.overdue > 0 ? `${entry.overdue} late` : null,
  }))

  const firstName = user?.name?.split(' ')[0] ?? 'there'
  const today = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date())

  const primaryTiles = [
    { label: 'Total Tasks', value: data.total_tasks, icon: ListTodo, tone: 'white', to: '/tasks' },
    {
      label: 'In Progress',
      value: data.in_progress_tasks,
      icon: Timer,
      tone: 'cyan',
      to: '/tasks?status=in_progress',
    },
    {
      label: 'Completed',
      value: data.completed_tasks,
      icon: CheckCircle2,
      tone: 'lime',
      hint: `${data.completion_rate}% completion rate`,
      to: '/tasks?status=completed',
    },
    {
      label: 'Pending',
      value: data.pending_tasks,
      icon: CircleDashed,
      tone: 'slate',
      to: '/tasks?status=pending',
    },
  ]

  const attentionTiles = [
    {
      label: 'Blocked Issues',
      value: data.blocked_tasks,
      icon: OctagonX,
      tone: 'rose',
      hint: data.blocked_tasks > 0 ? 'Requires unblocking' : 'No blockers',
      to: '/tasks?status=blocked',
    },
    {
      label: 'Overdue Work',
      value: data.overdue_tasks,
      icon: AlertTriangle,
      tone: 'rose',
      hint: data.overdue_tasks > 0 ? 'Past deadline' : 'All on schedule',
      to: '/tasks?overdue=true',
    },
  ]

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* --- Executive Header ------------------------------------------------ */}
      <motion.header
        variants={fadeUp}
        className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white/80 p-4 sm:p-5 shadow-xs backdrop-blur-md sm:flex-row sm:items-center sm:justify-between dark:border-slate-800/80 dark:bg-[#0e131f]/90"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="eyebrow">Command Center</span>
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Live Pulse</span>
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 font-display">
              Workspace Overview
            </h1>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              · welcome back, <span className="font-semibold text-slate-800 dark:text-slate-200">{firstName}</span>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold text-slate-700 shadow-2xs dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
            <CalendarDays className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
            {today}
          </span>
          <Link
            to="/tasks"
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-bold text-white shadow-sm shadow-emerald-600/25 transition-all hover:from-emerald-500 hover:to-teal-500 active:scale-98"
          >
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
            Task Backlog
          </Link>
        </div>
      </motion.header>

      {/* --- Main column + sidebar ----------------------------------------- */}
      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          {/* Four headline counts */}
          <motion.div
            variants={fadeUp}
            className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3"
          >
            {primaryTiles.map((tile) => (
              <div key={tile.label} className="min-w-0 rounded-2xl border border-slate-200/90 bg-white shadow-xs dark:border-slate-800/80 dark:bg-[#0e131f]">
                <StatCard
                  label={tile.label}
                  value={tile.value}
                  icon={tile.icon}
                  tone={tile.tone}
                  hint={tile.hint}
                  onClick={() => navigate(tile.to)}
                />
              </div>
            ))}
          </motion.div>

          {/* Two counts that need attention */}
          <motion.div variants={fadeUp} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-rose-600 dark:text-rose-400 font-display">
                Attention Required
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
              {attentionTiles.map((tile) => (
                <div key={tile.label} className="min-w-0 rounded-2xl border border-rose-200/80 bg-rose-50/30 dark:border-rose-950/60 dark:bg-rose-950/20">
                  <StatCard
                    label={tile.label}
                    value={tile.value}
                    icon={tile.icon}
                    tone={tile.tone}
                    hint={tile.hint}
                    onClick={() => navigate(tile.to)}
                  />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Featured chart */}
          <Panel>
            <ChartFrame
              title="Throughput"
              subtitle="Work opened vs. work finished · last 14 days"
              legend={
                <Legend
                  items={[
                    {
                      label: 'Created',
                      color: pick(SERIES_COLORS.created, isDark),
                      value: trendTotals.created,
                    },
                    {
                      label: 'Completed',
                      color: pick(SERIES_COLORS.completed, isDark),
                      value: trendTotals.completed,
                    },
                  ]}
                />
              }
            >
              <TrendChart
                data={data.trend}
                height={220}
                formatX={(iso) =>
                  new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                  })
                }
                formatTooltipX={(iso) =>
                  new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })
                }
                series={[
                  {
                    key: 'created',
                    label: 'Created',
                    color: pick(SERIES_COLORS.created, isDark),
                    fill: true,
                  },
                  {
                    key: 'completed',
                    label: 'Completed',
                    color: pick(SERIES_COLORS.completed, isDark),
                  },
                ]}
              />
            </ChartFrame>
          </Panel>

          {/* Supporting breakdowns — Completely Redesigned Analytics Matrix */}
          <div className="grid gap-5 md:grid-cols-2">
            {/* 1. Status Composition Hub */}
            <Panel className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800/80">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">
                      Status Composition
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Live breakdown of active backlog</p>
                  </div>
                  <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    Live
                  </span>
                </div>

                <div className="my-4 flex flex-col items-center justify-center gap-4">
                  <DonutChart
                    segments={donutSegments}
                    total={data.total_tasks}
                    heroLabel="total tasks"
                    size={150}
                    thickness={20}
                    onSegmentClick={(segment) => navigate(`/tasks?status=${segment.key}`)}
                  />

                  {/* 2x2 Clean Status Matrix with spacious layout */}
                  <div className="grid w-full grid-cols-2 gap-2.5">
                    {donutSegments.map((segment) => {
                      const share = data.total_tasks > 0 ? Math.round((segment.value / data.total_tasks) * 100) : 0
                      return (
                        <button
                          key={segment.key}
                          type="button"
                          onClick={() => navigate(`/tasks?status=${segment.key}`)}
                          className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2.5 text-left transition hover:border-emerald-400 dark:border-slate-800/80 dark:bg-slate-900/50 dark:hover:border-emerald-500/50 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: segment.color }} />
                            <span className="truncate text-xs font-bold text-slate-700 dark:text-slate-200">
                              {segment.label}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1.5 shrink-0 pl-1">
                            <span className="text-xs font-extrabold tabular-nums text-slate-900 dark:text-white font-display">
                              {segment.value}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400">
                              {share}%
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </Panel>

            {/* 2. Priority Severity Spectrum */}
            <Panel className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800/80">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">
                      Priority Spectrum
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Severity allocation across deliverables</p>
                  </div>
                  <span className="rounded-md bg-cyan-50 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">
                    Severity
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {prioritySeries.map((priority) => {
                    const share = data.total_tasks > 0 ? Math.round((priority.value / data.total_tasks) * 100) : 0
                    const maxCount = Math.max(1, ...prioritySeries.map((p) => p.value))
                    const barWidth = Math.max(4, Math.round((priority.value / maxCount) * 100))

                    const GRADIENTS = {
                      urgent: 'from-purple-600 via-purple-500 to-violet-400',
                      high: 'from-rose-600 via-rose-500 to-amber-500',
                      medium: 'from-cyan-600 via-cyan-500 to-blue-500',
                      low: 'from-slate-500 via-slate-400 to-slate-300 dark:from-slate-600 dark:to-slate-500',
                    }

                    return (
                      <button
                        key={priority.key}
                        type="button"
                        onClick={() => navigate(`/tasks?priority=${priority.key}`)}
                        className="group block w-full rounded-xl border border-slate-200/80 bg-slate-50/50 p-2.5 text-left transition hover:border-emerald-400 dark:border-slate-800/80 dark:bg-slate-900/40 dark:hover:border-emerald-500/50 cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <PriorityBadge priority={priority.key} />
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold tabular-nums text-slate-900 dark:text-slate-100 font-display">
                              {priority.value} <span className="text-[10px] font-normal text-slate-400">tasks</span>
                            </span>
                            <span className="rounded-sm bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {share}%
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-800">
                          <div
                            className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500', GRADIENTS[priority.key] ?? 'from-emerald-500 to-teal-400')}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </Panel>
          </div>

          {/* 3. Team Workload Capacity Roster */}
          <Panel>
            <div className="flex flex-col gap-1 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800/80">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">
                  Team Workload Capacity
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {data.due_this_week} deliverables due in the next 7 days
                </p>
              </div>
              <Link
                to="/team"
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
              >
                Team Directory <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            {workload.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">No tasks assigned yet.</p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {workload.map((entry) => {
                  const maxTasks = Math.max(1, ...workload.map((w) => w.value))
                  const barWidth = Math.max(6, Math.round((entry.value / maxTasks) * 100))

                  return (
                    <button
                      key={entry.key}
                      type="button"
                      onClick={() => navigate(`/tasks?assignee=${entry.key}`)}
                      className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 text-left transition hover:border-emerald-400 dark:border-slate-800/80 dark:bg-slate-900/40 dark:hover:border-emerald-500/50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar name={entry.label} size="sm" />
                          <span className="truncate text-xs font-bold text-slate-800 dark:text-slate-200">
                            {entry.label}
                          </span>
                        </div>
                        <span className="shrink-0 rounded-full bg-slate-200/80 px-2 py-0.5 text-[11px] font-extrabold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {entry.value}
                        </span>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-medium text-slate-400">Active Load</span>
                          {entry.note && (
                            <span className="font-bold text-rose-600 dark:text-rose-400">
                              {entry.note}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </Panel>
        </div>

        {/* --- Sidebar: personal queue + recent activity ------------------- */}
        <div className="space-y-6 lg:col-span-4">
          <Panel className="p-0">
            <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800/80">
              <div className="min-w-0">
                <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display">
                  Assigned to you
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {data.my_open_tasks} open tasks
                  {data.my_overdue_tasks > 0 && (
                    <span className="text-rose-600 font-semibold dark:text-rose-400">
                      {' · '}
                      {data.my_overdue_tasks} overdue
                    </span>
                  )}
                </p>
              </div>
              <Link
                to={`/tasks?assignee=${user?.id}`}
                className="inline-flex cursor-pointer shrink-0 items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </header>

            {data.my_recent_tasks.length === 0 ? (
              <p className="px-4 py-10 text-center text-xs text-slate-500 dark:text-slate-400">
                Nothing open assigned to you.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {data.my_recent_tasks.map((task) => (
                  <li key={task.id}>
                    <Link
                      to={`/tasks/${task.id}`}
                      className="group flex min-w-0 items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <span
                        className={cn('h-4 w-1 shrink-0 rounded-full', statusMeta(task.status).accent)}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700 transition-colors group-hover:text-slate-950 dark:text-slate-300 dark:group-hover:text-white">
                        {task.title}
                      </span>
                      <PriorityBadge priority={task.priority} />
                    </Link>
                    <div className="flex items-center justify-between px-5 pb-3 pl-[2.2rem] text-xs text-slate-400">
                      <span
                        className={cn(
                          'tabular-nums text-[11px]',
                          task.is_overdue && 'font-semibold text-rose-600 dark:text-rose-400',
                        )}
                      >
                        Due {formatDate(task.due_date)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel className="p-0">
            <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800/80">
              <div>
                <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display">
                  Recent activity
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Latest updates across the team
                </p>
              </div>
              <Link
                to="/tasks?sort_by=updated_at"
                className="inline-flex cursor-pointer shrink-0 items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </header>

            <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {data.recently_updated.map((task) => (
                <li key={task.id}>
                  <Link
                    to={`/tasks/${task.id}`}
                    className="group flex min-w-0 items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <span
                      className={cn('h-4 w-1 shrink-0 rounded-full', statusMeta(task.status).accent)}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700 transition-colors group-hover:text-slate-950 dark:text-slate-300 dark:group-hover:text-white">
                      {task.title}
                    </span>
                    {task.assignee ? (
                      <UserChip user={task.assignee} size="xs" className="w-24 shrink-0" />
                    ) : (
                      <span className="w-24 shrink-0 text-right text-xs italic text-slate-400">
                        Unassigned
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </motion.div>
  )
}
