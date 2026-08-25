import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '../../utils/cn'
import { Skeleton } from './States'

export function Table({
  columns,
  data,
  loading = false,
  rowKey = (row) => row.id,
  onRowClick,
  sortBy,
  sortOrder,
  onSort,
  emptyState,
  skeletonRows = 6,
}) {
  const showEmpty = !loading && (!data || data.length === 0)

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            {columns.map((column) => {
              const isSorted = sortBy === column.key
              const sortable = column.sortable && onSort

              return (
                <th
                  key={column.key}
                  scope="col"
                  style={column.width ? { width: column.width } : undefined}
                  className={cn(
                    'px-4 py-3 text-[11px] font-semibold uppercase tracking-wider',
                    'text-zinc-500 dark:text-zinc-400',
                    column.align === 'right' && 'text-right',
                    column.headerClassName,
                  )}
                  aria-sort={
                    isSorted ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined
                  }
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => onSort(column.key)}
                      className={cn(
                        'inline-flex cursor-pointer items-center gap-1 rounded transition-colors',
                        'hover:text-emerald-600 dark:hover:text-emerald-400',
                        isSorted && 'text-emerald-600 dark:text-emerald-400 font-bold',
                      )}
                    >
                      {column.header}
                      {isSorted ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" aria-hidden="true" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {loading &&
            Array.from({ length: skeletonRows }).map((_, rowIndex) => (
              <tr key={`skeleton-${rowIndex}`}>
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3.5">
                    <Skeleton className="h-4 w-full max-w-[160px]" />
                  </td>
                ))}
              </tr>
            ))}

          {!loading &&
            data?.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? 'button' : undefined}
                onKeyDown={
                  onRowClick
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          onRowClick(row)
                        }
                      }
                    : undefined
                }
                className={cn(
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-slate-50/90 dark:hover:bg-slate-800/40',
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-4 py-3.5 text-sm text-zinc-700 dark:text-zinc-300',
                      column.align === 'right' && 'text-right',
                      column.className,
                    )}
                  >
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>

      {showEmpty && emptyState}
    </div>
  )
}
