import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarClock, ClipboardList, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { taskService } from '../services/taskService'
import { userService } from '../services/userService'
import { useAsync } from '../hooks/useAsync'
import { useDebounce } from '../hooks/useDebounce'
import { useTaskFilters } from '../hooks/useTaskFilters'
import { useToast } from '../hooks/useToast'
import { TaskFilters } from '../components/tasks/TaskFilters'
import { TaskFormModal } from '../components/tasks/TaskFormModal'
import { formatDate, formatRelative } from '../utils/date'
import { cn } from '../utils/cn'
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  OverdueBadge,
  Pagination,
  PriorityBadge,
  StatusBadge,
  Table,
  UserChip,
} from '../components/ui'

export function TasksPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { filters, setFilters, resetFilters, toggleSort } = useTaskFilters()

  // The search box updates the URL immediately (so it stays responsive) but
  // the request only fires once typing pauses.
  const [searchInput, setSearchInput] = useState(filters.search ?? '')
  const debouncedSearch = useDebounce(searchInput, 350)

  useEffect(() => {
    if ((filters.search ?? '') !== debouncedSearch) {
      setFilters({ search: debouncedSearch || undefined })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const [formOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchTasks = useCallback(
    (options) => taskService.list(filters, options),
    // Serialised so the request re-runs on any filter change without an
    // unstable object identity re-triggering it every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(filters)],
  )
  const { data, error, loading, refetch } = useAsync(fetchTasks, [fetchTasks])

  const fetchUsers = useCallback((options) => userService.options(options), [])
  const { data: users } = useAsync(fetchUsers, [])

  async function handleSubmit(payload) {
    setSubmitting(true)
    try {
      if (editingTask) {
        await taskService.update(editingTask.id, payload)
        toast.success('Task updated')
      } else {
        await taskService.create(payload)
        toast.success('Task created')
      }
      setFormOpen(false)
      setEditingTask(null)
      refetch()
    } finally {
      // Errors deliberately propagate: the modal catches them to attach
      // field-level messages (422) to the offending inputs.
      setSubmitting(false)
    }
  }

  async function confirmDelete() {
    setDeleting(true)
    try {
      await taskService.remove(pendingDelete.id)
      toast.success('Task deleted')
      setPendingDelete(null)
      refetch()
    } catch (err) {
      toast.error(err?.message ?? 'Could not delete the task')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    {
      key: 'title',
      header: 'Task',
      sortable: true,
      render: (task) => (
        <div className="min-w-0 max-w-md py-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-bold text-slate-900 dark:text-slate-100 font-display">
              {task.title}
            </span>
            {task.is_overdue && <OverdueBadge />}
          </div>
          {task.description && (
            <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
              {task.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'assignee',
      header: 'Assignee',
      render: (task) => <UserChip user={task.assignee} size="xs" />,
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (task) => <PriorityBadge priority={task.priority} />,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (task) => <StatusBadge status={task.status} />,
    },
    {
      key: 'due_date',
      header: 'Due Date',
      sortable: true,
      width: '130px',
      render: (task) => (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 whitespace-nowrap text-xs',
            task.is_overdue
              ? 'font-bold text-rose-600 dark:text-rose-400'
              : 'text-slate-600 dark:text-slate-400',
          )}
        >
          <CalendarClock className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden="true" />
          {formatDate(task.due_date)}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      width: '112px',
      render: (task) => (
        <span className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
          {formatDate(task.created_at)}
        </span>
      ),
    },
    {
      key: 'updated_at',
      header: 'Updated',
      sortable: true,
      width: '120px',
      render: (task) => (
        <span className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
          {formatRelative(task.updated_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '90px',
      render: (task) => (
        <div className="flex justify-end gap-1" onClick={(event) => event.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditingTask(task)
              setFormOpen(true)
            }}
            aria-label={`Edit ${task.title}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPendingDelete(task)}
            aria-label={`Delete ${task.title}`}
            className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white/80 p-4 sm:p-5 shadow-xs backdrop-blur-md dark:border-slate-800/80 dark:bg-[#0e131f]/90">
        <div className="flex items-center gap-3 sm:gap-3.5">
          <span className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-sm shadow-emerald-600/25">
            <ClipboardList className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 font-display">Task Backlog</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Filter, search and manage all team deliverables in one place.
            </p>
          </div>
        </div>
        <Button
          icon={Plus}
          onClick={() => {
            setEditingTask(null)
            setFormOpen(true)
          }}
          className="w-full sm:w-auto"
        >
          Create Task
        </Button>
      </div>

      <TaskFilters
        filters={{ ...filters, search: searchInput }}
        onChange={(updates) => {
          if ('search' in updates) setSearchInput(updates.search ?? '')
          else setFilters(updates)
        }}
        onReset={() => {
          setSearchInput('')
          resetFilters()
        }}
        users={users ?? []}
        resultCount={data?.meta?.total}
      />

      <Card padded={false} className="overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs">
        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : (
          <>
            <Table
              columns={columns}
              data={data?.items}
              loading={loading}
              onRowClick={(task) => navigate(`/tasks/${task.id}`)}
              sortBy={filters.sort_by}
              sortOrder={filters.sort_order}
              onSort={toggleSort}
              emptyState={
                <EmptyState
                  icon={filters.search ? Search : ClipboardList}
                  title={filters.search ? 'No matching tasks' : 'No tasks yet'}
                  message={
                    filters.search
                      ? `Nothing matched “${filters.search}”. Try a different search or clear your filters.`
                      : 'Create the first task to get the team moving.'
                  }
                  action={
                    filters.search ? (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setSearchInput('')
                          resetFilters()
                        }}
                      >
                        Clear filters
                      </Button>
                    ) : (
                      <Button icon={Plus} onClick={() => setFormOpen(true)}>
                        New task
                      </Button>
                    )
                  }
                />
              }
            />
            <Pagination
              meta={data?.meta}
              onPageChange={(page) => setFilters({ page })}
              onLimitChange={(limit) => setFilters({ limit, page: 1 })}
            />
          </>
        )}
      </Card>

      <TaskFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingTask(null)
        }}
        onSubmit={handleSubmit}
        task={editingTask}
        users={users ?? []}
        submitting={submitting}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete this task?"
        message={
          pendingDelete
            ? `“${pendingDelete.title}” and all of its notes and history will be permanently removed.`
            : ''
        }
      />
    </div>
  )
}
