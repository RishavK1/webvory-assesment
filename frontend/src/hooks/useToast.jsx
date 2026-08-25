import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '../utils/cn'

const ToastContext = createContext(null)

let nextId = 0

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    style: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
    iconStyle: 'text-emerald-600 dark:text-emerald-400',
  },
  error: {
    icon: AlertCircle,
    style: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200',
    iconStyle: 'text-rose-600 dark:text-rose-400',
  },
  info: {
    icon: Info,
    style: 'border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
    iconStyle: 'text-slate-500 dark:text-slate-400',
  },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (message, variant = 'info', duration = 4000) => {
      const id = ++nextId
      setToasts((current) => [...current, { id, message, variant }])
      if (duration > 0) setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss],
  )

  const value = useMemo(
    () => ({
      toast: push,
      success: (message) => push(message, 'success'),
      error: (message) => push(message, 'error'),
      info: (message) => push(message, 'info'),
      dismiss,
    }),
    [push, dismiss],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* aria-live so screen readers announce results of an action they
          cannot see, e.g. "Task deleted". */}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        {toasts.map(({ id, message, variant }) => {
          const config = VARIANTS[variant] ?? VARIANTS.info
          const Icon = config.icon
          return (
            <div
              key={id}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg',
                'animate-in slide-in-from-bottom-2',
                config.style,
              )}
            >
              <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', config.iconStyle)} aria-hidden="true" />
              <p className="flex-1 text-sm font-medium">{message}</p>
              <button
                type="button"
                onClick={() => dismiss(id)}
                className="rounded p-0.5 opacity-60 transition hover:opacity-100"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside a <ToastProvider>')
  return context
}
