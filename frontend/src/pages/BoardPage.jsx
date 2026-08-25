import { useCallback, useEffect, useState } from 'react'
import { FolderKanban, Plus } from 'lucide-react'
import { taskService } from '../services/taskService'
import { userService } from '../services/userService'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../hooks/useToast'
import { TaskCard } from '../components/tasks/TaskCard'
import { TaskFormModal } from '../components/tasks/TaskFormModal'
import { TASK_STATUSES } from '../utils/constants'
import { cn } from '../utils/cn'
import { Button, ErrorState, LoadingState } from '../components/ui'

export function BoardPage() {
  const toast = useToast()

  const fetchBoard = useCallback((options) => taskService.board(options), [])
  const { data, error, loading, refetch } = useAsync(fetchBoard, [])

  const fetchUsers = useCallback((options) => userService.options(options), [])
  const { data: users } = useAsync(fetchUsers, [])

  const [tasks, setTasks] = useState([])
  const [draggingId, setDraggingId] = useState(null)
  const [dragOverStatus, setDragOverStatus] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (data) setTasks(data)
  }, [data])

  function handleDragStart(event, task) {
    setDraggingId(task.id)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(task.id))
  }

  async function handleDrop(event, newStatus) {
    event.preventDefault()
    setDragOverStatus(null)

    const taskId = Number(event.dataTransfer.getData('text/plain'))
    const task = tasks.find((item) => item.id === taskId)
    setDraggingId(null)

    if (!task || task.status === newStatus) return

    const previous = tasks
    setTasks((current) =>
      current.map((item) => (item.id === taskId ? { ...item, status: newStatus } : item)),
    )

    try {
      await taskService.update(taskId, { status: newStatus })
      toast.success(`Moved to ${TASK_STATUSES.find((s) => s.value === newStatus)?.label}`)
    } catch (err) {
      setTasks(previous)
      toast.error(err?.message ?? 'Could not move the task')
    }
  }

  async function handleCreate(payload) {
    setSubmitting(true)
    try {
      await taskService.create(payload)
      toast.success('Task created')
      setFormOpen(false)
      refetch()
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && !data) return <LoadingState label="Loading board…" />
  if (error) return <ErrorState error={error} onRetry={refetch} />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white/80 p-4 sm:p-5 shadow-xs backdrop-blur-md dark:border-slate-800/80 dark:bg-[#0e131f]/90">
        <div className="flex items-center gap-3 sm:gap-3.5">
          <span className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-sm shadow-emerald-600/25">
            <FolderKanban className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 font-display">
              Kanban Board
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Drag and drop cards across columns for instant status progression.
            </p>
          </div>
        </div>
        <Button icon={Plus} onClick={() => setFormOpen(true)} className="w-full sm:w-auto">
          New Task
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 items-start">
        {TASK_STATUSES.map((status) => {
          const columnTasks = tasks.filter((task) => task.status === status.value)
          const isDropTarget = dragOverStatus === status.value

          return (
            <section
              key={status.value}
              onDragOver={(event) => {
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
                setDragOverStatus(status.value)
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setDragOverStatus(null)
                }
              }}
              onDrop={(event) => handleDrop(event, status.value)}
              className={cn(
                'flex flex-col overflow-hidden rounded-2xl transition-all duration-200 shadow-xs',
                isDropTarget
                  ? 'border-2 border-dashed border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 dark:border-emerald-400/80 dark:bg-emerald-950/20'
                  : 'border border-slate-200/90 bg-slate-100/50 dark:border-slate-800/80 dark:bg-[#0b0f18]/60',
              )}
              aria-label={`${status.label} column, ${columnTasks.length} tasks`}
            >
              <header className="flex items-center gap-2.5 border-b border-slate-200/80 bg-white px-4 py-3.5 dark:border-slate-800/80 dark:bg-[#0e131f]">
                <span className={cn('h-2.5 w-2.5 rounded-full shadow-xs', status.accent)} aria-hidden="true" />
                <h3 className="text-xs font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display">
                  {status.label}
                </h3>
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-2 text-[11px] font-bold tabular-nums text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {columnTasks.length}
                </span>
              </header>

              <div className="scrollbar-thin flex max-h-[calc(100vh-19rem)] min-h-48 flex-col gap-3 overflow-y-auto p-3">
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    draggable
                    isDragging={draggingId === task.id}
                    onDragStart={handleDragStart}
                    onDragEnd={() => {
                      setDraggingId(null)
                      setDragOverStatus(null)
                    }}
                    className="shrink-0"
                  />
                ))}

                {columnTasks.length === 0 && (
                  <div
                    className={cn(
                      'flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed px-3 py-8 text-center text-xs font-semibold transition-colors',
                      isDropTarget
                        ? 'border-emerald-500 text-emerald-600 dark:border-emerald-400/80 dark:text-emerald-300'
                        : 'border-slate-300/80 text-slate-400 dark:border-slate-800 dark:text-slate-600',
                    )}
                  >
                    Drop task here
                  </div>
                )}
              </div>
            </section>
          )
        })}
      </div>

      <TaskFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
        users={users ?? []}
        submitting={submitting}
      />
    </div>
  )
}
