import { cn } from '../../../utils/cn'

/**
 * Shared chrome for every chart: heading, optional legend, and the plot slot.
 *
 * Keeping the frame in one place is what stops six charts from each inventing
 * their own title size, legend position and empty state.
 */
export function ChartFrame({ title, subtitle, legend, children, className, action }) {
  return (
    <figure className={cn('flex min-w-0 flex-col', className)}>
      <figcaption className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-zinc-900 dark:text-zinc-100">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
          )}
        </div>
        {action}
      </figcaption>

      <div className="min-w-0 flex-1">{children}</div>

      {legend && <div className="mt-4">{legend}</div>}
    </figure>
  )
}

/**
 * Legend. Present whenever a chart carries two or more series, so identity is
 * never communicated by colour alone.
 */
export function Legend({ items, className }) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5', className)}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 shrink-0 rounded-[2px]"
            style={{ background: item.color }}
            aria-hidden="true"
          />
          <span className="text-xs text-zinc-600 dark:text-zinc-400">{item.label}</span>
          {item.value !== undefined && (
            <span className="text-xs font-medium tabular-nums text-zinc-900 dark:text-zinc-200">
              {item.value}
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}

/** Floating tooltip. Enhances the chart; never the only way to read a value. */
export function ChartTooltip({ x, y, children, visible }) {
  if (!visible) return null
  return (
    <div
      className={cn(
        'pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full',
        'rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-lg',
        'dark:border-zinc-800 dark:bg-[#191b23]',
      )}
      style={{ left: x, top: y - 8 }}
      role="tooltip"
    >
      {children}
    </div>
  )
}
