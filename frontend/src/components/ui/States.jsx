import { AlertCircle, Inbox, Loader2, RefreshCw, WifiOff } from 'lucide-react'
import { cn } from '../../utils/cn'
import { Button } from './Button'

export function Spinner({ className, label = 'Loading' }) {
  return (
    <>
      <Loader2 className={cn('h-5 w-5 animate-spin text-emerald-600 dark:text-emerald-400', className)} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </>
  )
}

export function LoadingState({ label = 'Loading…', className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 px-6 py-16', className)}>
      <Spinner className="h-6 w-6" />
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>
    </div>
  )
}

/** Grey placeholder block, sized by the caller. */
export function Skeleton({ className }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-800/80', className)}
      aria-hidden="true"
    />
  )
}

export function EmptyState({ title, message, icon: Icon = Inbox, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-16 text-center', className)}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40">
        <Icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" aria-hidden="true" strokeWidth={1.75} />
      </div>
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      {message && (
        <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/**
 * Failure state with a retry affordance.
 *
 * A dropped connection is shown differently from a server error, because the
 * useful next step differs: check your network vs. try again / report it.
 */
export function ErrorState({ error, onRetry, className }) {
  const isNetwork = error?.isNetworkError || error?.code === 'network_error'
  const Icon = isNetwork ? WifiOff : AlertCircle

  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-16 text-center', className)}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-400/10">
        <Icon className="h-6 w-6 text-orange-600 dark:text-orange-400" aria-hidden="true" strokeWidth={1.75} />
      </div>
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {isNetwork ? 'Cannot reach the server' : 'Something went wrong'}
      </h3>
      <p className="mt-1 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
        {error?.message || 'An unexpected error occurred.'}
      </p>
      {onRetry && (
        <Button variant="secondary" icon={RefreshCw} onClick={onRetry} className="mt-5">
          Try again
        </Button>
      )}
    </div>
  )
}
