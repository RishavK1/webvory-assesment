import { useEffect, useState } from 'react'
import { AlignLeft, CalendarClock, Flag, UserRound } from 'lucide-react'
import { Button, Input, Modal, Select, Textarea } from '../ui'
import { TASK_PRIORITIES, TASK_STATUSES } from '../../utils/constants'
import { fromDateTimeLocalValue, toDateTimeLocalValue } from '../../utils/date'

const EMPTY_FORM = {
  title: '',
  description: '',
  status: 'pending',
  priority: 'medium',
  assigned_to: '',
  due_date: '',
}

function toFormState(task) {
  if (!task) return EMPTY_FORM
  return {
    title: task.title ?? '',
    description: task.description ?? '',
    status: task.status ?? 'pending',
    priority: task.priority ?? 'medium',
    assigned_to: task.assignee?.id ? String(task.assignee.id) : '',
    due_date: toDateTimeLocalValue(task.due_date),
  }
}

function FieldGroup({ icon: Icon, title, children }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {title}
      </div>
      {children}
    </div>
  )
}

/**
 * Create/edit dialog, used by the task list, the board and the detail page.
 *
 * One component serves both modes: passing a `task` switches it to edit and
 * pre-fills the fields, so the two flows can never drift apart.
 */
export function TaskFormModal({ open, onClose, onSubmit, task = null, users = [], submitting = false }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  const isEdit = Boolean(task)

  // Re-seed the form whenever the dialog opens, so a previous edit's values
  // never leak into the next one.
  useEffect(() => {
    if (open) {
      setForm(toFormState(task))
      setErrors({})
    }
  }, [open, task])

  const setField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  /** Client-side checks mirror the server's; the server remains authoritative. */
  function validate() {
    const found = {}
    const title = form.title.trim()
    if (!title) found.title = 'Title is required'
    else if (title.length < 3) found.title = 'Title must be at least 3 characters'
    else if (title.length > 200) found.title = 'Title must be 200 characters or fewer'
    if (form.description.length > 5000) found.description = 'Description is too long'
    setErrors(found)
    return Object.keys(found).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validate()) return

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      status: form.status,
      priority: form.priority,
      assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
      due_date: fromDateTimeLocalValue(form.due_date),
    }

    try {
      await onSubmit(payload)
    } catch (error) {
      // Surface server-side field errors (422) next to the offending input.
      if (error?.fields) setErrors(error.fields)
      else setErrors({ title: error?.message ?? 'Could not save the task' })
    }
  }

  const assigneeOptions = users.map((user) => ({ value: String(user.id), label: user.name }))

  return (
    <Modal
      open={open}
      onClose={submitting ? undefined : onClose}
      title={isEdit ? 'Edit task' : 'Create task'}
      description={isEdit ? `Updating “${task.title}”` : 'Add a new task to the team backlog.'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="task-form" loading={submitting}>
            {isEdit ? 'Save changes' : 'Create task'}
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={handleSubmit} className="space-y-6" noValidate>
        <FieldGroup icon={AlignLeft} title="Overview">
          <Input
            label="Title"
            required
            value={form.title}
            onChange={setField('title')}
            error={errors.title}
            placeholder="e.g. Architect multi-region read replicas for PostgreSQL"
            maxLength={200}
            autoFocus
          />

          <Textarea
            label="Description"
            rows={4}
            value={form.description}
            onChange={setField('description')}
            error={errors.description}
            placeholder="What needs to be done, and what does done look like?"
            hint={`${form.description.length}/5000`}
          />
        </FieldGroup>

        <div className="border-t border-zinc-100 dark:border-zinc-800/80" />

        <FieldGroup icon={Flag} title="Status & priority">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Status"
              value={form.status}
              onChange={setField('status')}
              options={TASK_STATUSES.map(({ value, label }) => ({ value, label }))}
              error={errors.status}
            />
            <Select
              label="Priority"
              value={form.priority}
              onChange={setField('priority')}
              options={TASK_PRIORITIES.map(({ value, label }) => ({ value, label }))}
              error={errors.priority}
            />
          </div>
        </FieldGroup>

        <div className="border-t border-zinc-100 dark:border-zinc-800/80" />

        <FieldGroup icon={UserRound} title="Assignment & timing">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Assignee"
              value={form.assigned_to}
              onChange={setField('assigned_to')}
              options={assigneeOptions}
              placeholder="Unassigned"
              error={errors.assigned_to}
            />
            <Input
              label="Due date"
              type="datetime-local"
              icon={CalendarClock}
              value={form.due_date}
              onChange={setField('due_date')}
              error={errors.due_date}
            />
          </div>
        </FieldGroup>
      </form>
    </Modal>
  )
}
