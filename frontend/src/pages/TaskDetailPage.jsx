import { useCallback, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  CalendarDays,
  ChevronLeft,
  Clock,
  History,
  Pencil,
  Trash2,
  UserRound,
} from 'lucide-react'
import { taskService } from '../services/taskService'
import { userService } from '../services/userService'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../hooks/useToast'
import { ActivityFeed } from '../components/tasks/ActivityFeed'
import { CommentList } from '../components/tasks/CommentList'
import { TaskFormModal } from '../components/tasks/TaskFormModal'
import { TASK_PRIORITIES, TASK_STATUSES } from '../utils/constants'
import { cn } from '../utils/cn'
import { formatDate, formatDateTime, formatRelative } from '../utils/date'
import {
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  ErrorState,
  LoadingState,
  OverdueBadge,
  Select,
  UserChip,
} from '../components/ui'

function DetailItem({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 shadow-2xs dark:bg-slate-800 dark:text-slate-400">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-display">{label}</p>
        <div className="mt-0.5 truncate text-xs font-semibold text-slate-800 dark:text-slate-200">{children}</div>
      </div>
    </div>
  )
}

export function TaskDetailPage() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [editOpen, setEditOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchTask = useCallback((options) => taskService.get(taskId, options), [taskId])
  const { data: task, error, loading, refetch } = useAsync(fetchTask, [fetchTask])

  const fetchComments = useCallback((options) => taskService.listComments(taskId, options), [taskId])
  const { data: comments, loading: commentsLoading, refetch: refetchComments } = useAsync(
    fetchComments,
    [fetchComments],
  )

  const fetchActivity = useCallback((options) => taskService.listActivity(taskId, options), [taskId])
  const { data: activity, loading: activityLoading, refetch: refetchActivity } = useAsync(
    fetchActivity,
    [fetchActivity],
  )

  const fetchUsers = useCallback((options) => userService.options(options), [])
  const { data: users } = useAsync(fetchUsers, [])

  async function patchField(field, value) {
    try {
      await taskService.update(taskId, { [field]: value })
      toast.success('Task updated')
      refetch()
      refetchActivity()
    } catch (err) {
      toast.error(err?.message ?? 'Could not update the task')
    }
  }

  async function handleEditSubmit(payload) {
    setSubmitting(true)
    try {
      await taskService.update(taskId, payload)
      toast.success('Task updated')
      setEditOpen(false)
      refetch()
      refetchActivity()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await taskService.remove(taskId)
      toast.success('Task deleted')
      navigate('/tasks')
    } catch (err) {
      toast.error(err?.message ?? 'Could not delete the task')
      setDeleting(false)
    }
  }

  if (loading && !task) return <LoadingState label="Loading task details…" />
  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" icon={ChevronLeft} onClick={() => navigate('/tasks')}>
          Back to tasks
        </Button>
        <ErrorState error={error} onRetry={refetch} />
      </div>
    )
  }
  if (!task) return null

  const commentCount = comments?.length ?? 0

  return (
    <div className="space-y-6">
      <Link
        to="/tasks"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Task Backlog
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Main Task Header Card */}
          <Card padded={false} className="overflow-hidden rounded-2xl border border-slate-200/90 shadow-xs dark:border-slate-800/80">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 p-4 sm:p-6">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    TASK-{task.id}
                  </span>
                  {task.is_overdue && <OverdueBadge />}
                </div>
                <h1 className="mt-2 text-xl font-extrabold leading-snug tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl font-display">
                  {task.title}
                </h1>
              </div>

              <div className="flex shrink-0 gap-2 w-full sm:w-auto justify-end">
                <Button variant="secondary" icon={Pencil} onClick={() => setEditOpen(true)} className="flex-1 sm:flex-initial">
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setConfirmDelete(true)}
                  aria-label="Delete task"
                  className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 border-t border-slate-100 bg-slate-50/70 p-4 sm:px-6 sm:py-4 dark:border-slate-800/80 dark:bg-slate-900/40">
              <Select
                label="Quick Status"
                value={task.status}
                onChange={(event) => patchField('status', event.target.value)}
                options={TASK_STATUSES.map(({ value, label }) => ({ value, label }))}
                containerClassName="w-full sm:w-48"
              />
              <Select
                label="Quick Priority"
                value={task.priority}
                onChange={(event) => patchField('priority', event.target.value)}
                options={TASK_PRIORITIES.map(({ value, label }) => ({ value, label }))}
                containerClassName="w-full sm:w-48"
              />
            </div>
          </Card>

          {/* Description */}
          <Card className="rounded-2xl border border-slate-200/90 shadow-xs dark:border-slate-800/80">
            <CardHeader title="Task Description" />
            <p
              className={cn(
                'mt-3 whitespace-pre-wrap text-xs leading-relaxed',
                task.description
                  ? 'text-slate-700 dark:text-slate-300'
                  : 'italic text-slate-400 dark:text-slate-500',
              )}
            >
              {task.description || 'No description provided for this deliverable.'}
            </p>
          </Card>

          {/* Activity Timeline */}
          <Card className="rounded-2xl border border-slate-200/90 shadow-xs dark:border-slate-800/80">
            <CardHeader
              title="Audit & Activity History"
              subtitle="Full chronological trace of status transitions and assignments"
              action={
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <History className="h-4 w-4" aria-hidden="true" />
                </span>
              }
            />
            <div className="mt-5">
              <ActivityFeed activities={activity ?? []} loading={activityLoading} />
            </div>
          </Card>
        </div>

        {/* Sidebar info + notes */}
        <div className="space-y-6">
          <Card className="rounded-2xl border border-slate-200/90 shadow-xs dark:border-slate-800/80">
            <CardHeader title="Metadata & Ownership" />
            <div className="mt-4 space-y-4">
              <DetailItem icon={UserRound} label="Assigned Member">
                <UserChip user={task.assignee} size="xs" />
              </DetailItem>
              <DetailItem icon={CalendarDays} label="Due Date">
                <span className={task.is_overdue ? 'font-bold text-rose-600 dark:text-rose-400' : ''}>
                  {task.due_date ? formatDateTime(task.due_date) : 'No deadline configured'}
                </span>
              </DetailItem>
              <DetailItem icon={UserRound} label="Created By">
                <UserChip user={task.creator} size="xs" />
              </DetailItem>
              <DetailItem icon={Clock} label="Created At">
                {formatDate(task.created_at)}
              </DetailItem>
              <DetailItem icon={Clock} label="Last Modified">
                {formatRelative(task.updated_at)}
              </DetailItem>
            </div>
          </Card>

          <Card className="rounded-2xl border border-slate-200/90 shadow-xs dark:border-slate-800/80">
            <CardHeader
              title="Team Discussion"
              action={
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {commentCount} {commentCount === 1 ? 'note' : 'notes'}
                </span>
              }
            />
            <div className="mt-4">
              <CommentList
                comments={comments ?? []}
                loading={commentsLoading}
                onAdd={async (text) => {
                  await taskService.addComment(taskId, text)
                  toast.success('Note added')
                  refetchComments()
                  refetchActivity()
                  refetch()
                }}
                onDelete={async (commentId) => {
                  await taskService.removeComment(taskId, commentId)
                  toast.success('Note deleted')
                  refetchComments()
                  refetch()
                }}
              />
            </div>
          </Card>
        </div>
      </div>

      <TaskFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
        task={task}
        users={users ?? []}
        submitting={submitting}
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this task?"
        message={`“${task.title}” and all associated history will be permanently deleted.`}
      />
    </div>
  )
}
