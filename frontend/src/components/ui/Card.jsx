import { cn } from '../../utils/cn'
import { useCountUp } from '../../hooks/useCountUp'

export function Card({ children, className, padded = true }) {
  return <div className={cn('card', padded && 'p-5', className)}>{children}</div>
}

export function CardHeader({ title, subtitle, action, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/**
 * Dashboard metric tile.
 *
 * `tone` colours the icon chip only — the number itself stays high-contrast
 * so the value is always the most legible thing on the tile.
 */
export function StatCard({ label, value, icon: Icon, tone = 'slate', hint, onClick, delta }) {
  const TONES = {
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300',
    lime: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300',
    cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-300',
    white: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300',
  }

  const animated = useCountUp(typeof value === 'number' ? value : 0)
  const display = typeof value === 'number' ? animated : value
  const Element = onClick ? 'button' : 'div'

  return (
    <Element
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      className={cn(
        'relative flex h-full min-h-28 sm:min-h-32 flex-col justify-between overflow-hidden p-3 sm:px-5 sm:py-4.5 text-left',
        onClick && 'cursor-pointer',
      )}
    >
      <div className="flex items-center gap-1.5 sm:gap-2">
        {Icon && (
          <span className={cn('flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg shadow-xs shrink-0', TONES[tone])}>
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" aria-hidden="true" strokeWidth={2} />
          </span>
        )}
        <span className="truncate text-[10px] sm:text-[11px] font-bold uppercase tracking-wider sm:tracking-[0.16em] text-slate-500 dark:text-slate-400 font-display">
          {label}
        </span>
      </div>

      <div className="mt-3 sm:mt-4 flex items-end justify-between gap-1.5">
        <span className="text-2xl sm:text-[32px] font-extrabold leading-none tracking-tight tabular-nums text-slate-900 dark:text-slate-50 font-display">
          {display}
        </span>
        {delta && <span className="text-[10px] sm:text-[11px] font-medium text-slate-400">{delta}</span>}
      </div>

      {hint && <p className="mt-1.5 sm:mt-2 truncate text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400">{hint}</p>}
    </Element>
  )
}
