import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'
import { Modal } from './Modal'

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  loading = false,
  variant = 'danger',
}) {
  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      size="sm"
      closeOnOverlayClick={!loading}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-500/15">
          <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" aria-hidden="true" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 pt-0.5">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
          {message && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{message}</p>}
        </div>
      </div>
    </Modal>
  )
}
