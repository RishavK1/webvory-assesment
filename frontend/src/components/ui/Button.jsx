import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

const VARIANTS = {
  primary:
    'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-600/25 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 dark:from-emerald-500 dark:to-teal-500 dark:shadow-emerald-950/40 dark:hover:from-emerald-400 dark:hover:to-teal-400',
  secondary:
    'bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-800/80 dark:text-slate-200 dark:border-slate-700/80 dark:hover:bg-slate-800 dark:hover:border-slate-600',
  ghost:
    'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100',
  danger:
    'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-sm shadow-rose-600/25 hover:from-rose-500 hover:to-pink-500 active:from-rose-700 active:to-pink-700',
  subtle:
    'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50',
}

const SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9.5 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-[15px] gap-2',
  icon: 'h-9 w-9',
}

/**
 * The single button primitive used everywhere in the app.
 *
 * `loading` both shows a spinner and disables the button, which is what
 * prevents a double-submit creating two tasks on a slow connection.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  className,
  type = 'button',
  ...props
}) {
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center rounded-lg font-semibold whitespace-nowrap',
        'transition-all duration-150 active:scale-[0.97]',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
      ) : (
        Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={2} />
      )}
      {children}
      {IconRight && !loading && (
        <IconRight className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={2} />
      )}
    </button>
  )
}
