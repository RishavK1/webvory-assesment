import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'
import { Button } from './Button'

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
}) {
  const panelRef = useRef(null)
  const previouslyFocused = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return

    previouslyFocused.current = document.activeElement

    // Prevent the page behind the overlay from scrolling.
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusable = () =>
      panelRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      ) ?? []

    // Move initial focus into autofocus input or first form control
    requestAnimationFrame(() => {
      if (!panelRef.current) return
      const autoFocusEl = panelRef.current.querySelector('[autofocus]')
      if (autoFocusEl) {
        autoFocusEl.focus()
        return
      }
      const firstInput = panelRef.current.querySelector('input:not([disabled]), textarea:not([disabled]), select:not([disabled])')
      if (firstInput) {
        firstInput.focus()
        return
      }
      const items = focusable()
      ;(items[0] ?? panelRef.current)?.focus()
    })

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onCloseRef.current?.()
        return
      }
      if (event.key !== 'Tab') return

      const items = Array.from(focusable())
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]

      // Wrap focus at both ends of the dialog.
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = originalOverflow
      previouslyFocused.current?.focus?.()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="fixed inset-0 bg-zinc-950/50 backdrop-blur-sm"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        tabIndex={-1}
        className={cn(
          'relative z-10 flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl',
          'sm:rounded-2xl dark:border dark:border-slate-800/80 dark:bg-[#0e131f]',
          SIZES[size],
        )}
      >
        {title && (
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4.5 dark:border-slate-800/80">
            <div className="min-w-0">
              <h2
                id="modal-title"
                className="text-base font-bold text-slate-900 dark:text-slate-50 font-display"
              >
                {title}
              </h2>
              {description && (
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800/80">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
