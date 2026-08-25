import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../utils/cn'
import { PAGE_SIZES } from '../../utils/constants'

/**
 * Build a compact page list with ellipses: 1 … 4 5 6 … 20
 *
 * Rendering every page number breaks down past a few dozen pages, so only a
 * window around the current page plus the first and last are shown.
 */
function pageWindow(current, total, span = 1) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = new Set([1, total, current])
  for (let offset = 1; offset <= span; offset += 1) {
    if (current - offset > 1) pages.add(current - offset)
    if (current + offset < total) pages.add(current + offset)
  }

  const sorted = [...pages].sort((a, b) => a - b)
  const withGaps = []
  let previous = 0
  for (const page of sorted) {
    if (page - previous > 1) withGaps.push('…')
    withGaps.push(page)
    previous = page
  }
  return withGaps
}

export function Pagination({ meta, onPageChange, onLimitChange, className }) {
  if (!meta || meta.total === 0) return null

  const { page, pages, total, limit, has_next: hasNext, has_prev: hasPrev } = meta
  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        'flex flex-col gap-3 border-t border-zinc-200 px-4 py-3',
        'sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800',
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Showing <span className="font-medium tabular-nums text-zinc-900 dark:text-zinc-200">{from}</span>–
          <span className="font-medium tabular-nums text-zinc-900 dark:text-zinc-200">{to}</span> of{' '}
          <span className="font-medium tabular-nums text-zinc-900 dark:text-zinc-200">{total}</span>
        </p>

        {onLimitChange && (
          <label className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
            <span className="hidden sm:inline">Rows</span>
            <select
              value={limit}
              onChange={(event) => onLimitChange(Number(event.target.value))}
              className="cursor-pointer rounded-md border-0 bg-transparent py-1 pl-2 pr-7 text-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-indigo-500 dark:ring-white/10 dark:focus:ring-indigo-400"
              aria-label="Rows per page"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrev}
          className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {pageWindow(page, pages).map((entry, index) =>
          entry === '…' ? (
            <span
              key={`gap-${index}`}
              className="px-1.5 text-sm text-slate-400"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              onClick={() => onPageChange(entry)}
              aria-current={entry === page ? 'page' : undefined}
              className={cn(
                'h-8 min-w-8 cursor-pointer rounded-lg px-2 text-sm font-semibold tabular-nums transition shadow-xs',
                entry === page
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-600/25'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
              )}
            >
              {entry}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
          className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800"
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  )
}
