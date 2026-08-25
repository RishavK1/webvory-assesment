import { useState } from 'react'
import { MessageSquareText, SendHorizontal, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { formatRelative } from '../../utils/date'
import { Avatar, Button, ConfirmDialog, EmptyState, Textarea } from '../ui'

export function CommentList({ comments, onAdd, onDelete, loading = false }) {
  const { user } = useAuth()
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || submitting) return

    setSubmitting(true)
    try {
      await onAdd(text)
      setDraft('')
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmDelete() {
    setDeleting(true)
    try {
      await onDelete(pendingDelete.id)
      setPendingDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <Textarea
          label="Add discussion note"
          rows={3}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Share an update, decision, or blocker on this task…"
          maxLength={2000}
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" icon={SendHorizontal} loading={submitting} disabled={!draft.trim()}>
            Post Note
          </Button>
        </div>
      </form>

      {loading && <p className="text-xs text-slate-500 dark:text-slate-400">Loading notes…</p>}

      {!loading && comments.length === 0 && (
        <EmptyState
          icon={MessageSquareText}
          title="No notes yet"
          message="Post an update to start the discussion thread."
          className="py-8"
        />
      )}

      <ul className="space-y-3">
        {comments.map((comment) => (
          <li key={comment.id} className="flex gap-3">
            <Avatar name={comment.user?.name} size="sm" className="mt-0.5" />
            <div className="min-w-0 flex-1 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 shadow-2xs dark:border-slate-800/80 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 font-display">
                  {comment.user?.name ?? 'Unknown'}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">{formatRelative(comment.created_at)}</span>

                {comment.user?.id === user?.id && (
                  <button
                    type="button"
                    onClick={() => setPendingDelete(comment)}
                    className="ml-auto cursor-pointer rounded-full p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
                    aria-label="Delete note"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                {comment.comment}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete this note?"
        message="This comment will be permanently deleted."
      />
    </div>
  )
}
