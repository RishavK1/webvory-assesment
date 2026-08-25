import { cn } from '../../../utils/cn'
import { motion } from 'motion/react'

export function BarChart({ data, color, max, formatValue = (v) => v, onBarClick, emptyLabel }) {
  const ceiling = max ?? Math.max(1, ...data.map((row) => row.value))

  if (data.length === 0) {
    <p className="py-6 text-sm text-zinc-500 dark:text-zinc-400">{emptyLabel}</p>
  }

  return (
    <ul className="space-y-2.5">
      {data.map((row) => {
        const Row = onBarClick ? 'button' : 'div'
        return (
          <li key={row.key}>
            <Row
              type={onBarClick ? 'button' : undefined}
              onClick={onBarClick ? () => onBarClick(row) : undefined}
              className={cn(
                'block w-full text-left',
                onBarClick && 'group cursor-pointer rounded focus-visible:outline-2',
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[13px] text-zinc-700 dark:text-zinc-300">
                  {row.label}
                </span>
                <span className="shrink-0 text-[13px] font-medium tabular-nums text-zinc-900 dark:text-zinc-200">
                  {formatValue(row.value)}
                  {row.note && (
                    <span className="ml-1.5 font-normal text-rose-600 dark:text-rose-400">
                      {row.note}
                    </span>
                  )}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-white/8">
                <motion.div
                  // 4px rounded data-end, anchored to the baseline.
                  className="h-full origin-left rounded-full"
                  style={{
                    width: `${Math.max(2, (row.value / ceiling) * 100)}%`,
                    background: row.color ?? color,
                  }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20, delay: 0.06 }}
                />
              </div>
            </Row>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Part-to-whole as a single horizontal stacked bar.
 *
 * Segments are separated by a 2px gap in the surface colour rather than a
 * stroke, and labels only render inside a segment when they actually fit —
 * otherwise the first characters get clipped.
 */
export function StackedBar({ segments, total, height = 10, showInlineLabels = false }) {
  if (!total) {
    return <div className="h-2.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800" />
  }

  return (
    <div className="flex w-full gap-0.5" style={{ height }} role="img">
      {segments
        .filter((segment) => segment.value > 0)
        .map((segment, index, visible) => {
          const share = (segment.value / total) * 100
          return (
            <div
              key={segment.key}
              className={cn(
                'relative h-full overflow-hidden transition-all duration-500',
                index === 0 && 'rounded-l-full',
                index === visible.length - 1 && 'rounded-r-full',
              )}
              style={{ width: `${share}%`, background: segment.color }}
              title={`${segment.label}: ${segment.value}`}
            >
              {showInlineLabels && share > 12 && (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white">
                  {segment.value}
                </span>
              )}
            </div>
          )
        })}
    </div>
  )
}
