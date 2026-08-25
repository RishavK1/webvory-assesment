import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { ListChecks, Search, Trash2, UserPlus, Users } from 'lucide-react'
import { userService } from '../services/userService'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../context/AuthContext'
import { useDebounce } from '../hooks/useDebounce'
import { useToast } from '../hooks/useToast'
import { USER_ROLES } from '../utils/constants'
import { formatDate } from '../utils/date'
import { cn } from '../utils/cn'
import {
  Avatar,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  Pagination,
  Select,
  Table,
} from '../components/ui'

const EMPTY_USER = { name: '', email: '', role: 'member', password: '' }

export function TeamPage() {
  const toast = useToast()
  const { user: currentUser, canManageTeam, hasRole } = useAuth()

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 350)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_USER)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchUsers = useCallback(
    (options) => userService.list({ search: debouncedSearch || undefined, page, limit }, options),
    [debouncedSearch, page, limit],
  )
  const { data, error, loading, refetch } = useAsync(fetchUsers, [fetchUsers])

  async function handleCreate(event) {
    event.preventDefault()
    setErrors({})
    setSubmitting(true)
    try {
      await userService.create({ ...form, name: form.name.trim(), email: form.email.trim() })
      toast.success('Team member added')
      setFormOpen(false)
      setForm(EMPTY_USER)
      refetch()
    } catch (err) {
      if (err?.fields) setErrors(err.fields)
      else setErrors({ email: err?.message ?? 'Could not create the user' })
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmDelete() {
    setDeleting(true)
    try {
      await userService.remove(pendingDelete.id)
      toast.success('Team member removed')
      setPendingDelete(null)
      refetch()
    } catch (err) {
      toast.error(err?.message ?? 'Could not remove the user')
    } finally {
      setDeleting(false)
    }
  }

  const ROLE_STYLES = {
    admin: 'bg-emerald-50 text-emerald-700 ring-emerald-600/25 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-400/25',
    manager: 'bg-cyan-50 text-cyan-700 ring-cyan-600/25 dark:bg-cyan-950/50 dark:text-cyan-300 dark:ring-cyan-400/25',
    member: 'bg-slate-100 text-slate-700 ring-slate-400/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  }

  const columns = [
    {
      key: 'name',
      header: 'Team Member',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} size="md" />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate font-bold text-slate-900 dark:text-slate-100 font-display">
              {row.name}
              {row.id === currentUser?.id && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                  you
                </span>
              )}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Access Role',
      render: (row) => (
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ring-1 ring-inset',
            ROLE_STYLES[row.role] ?? ROLE_STYLES.member,
          )}
        >
          {row.role}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Account Status',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              row.is_active ? 'bg-emerald-500 shadow-xs' : 'bg-slate-300 dark:bg-slate-600',
            )}
            aria-hidden="true"
          />
          {row.is_active ? 'Active' : 'Deactivated'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Joined Date',
      render: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {formatDate(row.created_at)}
        </span>
      ),
    },
    {
      key: 'tasks',
      header: '',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            to={`/tasks?assignee=${row.id}`}
            className="inline-flex cursor-pointer items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold text-emerald-600 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
          >
            <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
            View Tasks
          </Link>
          {hasRole('admin') && row.id !== currentUser?.id && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPendingDelete(row)}
              aria-label={`Remove ${row.name}`}
              className="text-slate-400 hover:text-rose-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white/80 p-4 sm:p-5 shadow-xs backdrop-blur-md dark:border-slate-800/80 dark:bg-[#0e131f]/90">
        <div className="flex items-center gap-3 sm:gap-3.5">
          <span className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-sm shadow-emerald-600/25">
            <Users className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 font-display">
              Team Directory
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {data?.meta?.total ?? 0} active members in workspace.
            </p>
          </div>
        </div>
        {canManageTeam && (
          <Button icon={UserPlus} onClick={() => setFormOpen(true)} className="w-full sm:w-auto">
            Add Member
          </Button>
        )}
      </div>

      <Card padded={false} className="overflow-hidden rounded-2xl border border-slate-200/90 shadow-xs dark:border-slate-800/80">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
          <Input
            icon={Search}
            placeholder="Search member by name or email…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            containerClassName="max-w-sm flex-1"
          />
        </div>

        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : (
          <>
            <Table
              columns={columns}
              data={data?.items}
              loading={loading}
              emptyState={
                <EmptyState
                  icon={Users}
                  title="No team members found"
                  message={
                    search ? `Nothing matched “${search}”.` : 'Add your first team member to begin.'
                  }
                />
              }
            />
            <Pagination
              meta={data?.meta}
              onPageChange={setPage}
              onLimitChange={(next) => {
                setLimit(next)
                setPage(1)
              }}
            />
          </>
        )}
      </Card>

      <Modal
        open={formOpen}
        onClose={submitting ? undefined : () => setFormOpen(false)}
        title="Add workspace member"
        description="Provide member credentials and designate access role."
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form="user-form" loading={submitting}>
              Add Member
            </Button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleCreate} className="space-y-4" noValidate>
          <Input
            label="Full Name"
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            error={errors.name}
            placeholder="Alex Vance"
            autoFocus
          />
          <Input
            label="Email Address"
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            placeholder="alex@webvory.com"
            error={errors.email}
          />
          <Select
            label="Workspace Role"
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value })}
            options={USER_ROLES}
            error={errors.role}
          />
          <Input
            label="Initial Password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            error={errors.password}
            hint="Minimum 8 characters. Member will be prompted to update upon first sign-in."
          />
        </form>
      </Modal>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Remove team member?"
        message={
          pendingDelete
            ? `${pendingDelete.name} will be removed from Webvory. Assigned tasks will become unassigned.`
            : ''
        }
        confirmLabel="Remove Member"
      />
    </div>
  )
}
