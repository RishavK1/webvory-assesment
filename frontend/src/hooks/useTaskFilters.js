import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

const DEFAULTS = { page: '1', limit: '10', sort_by: 'created_at', sort_order: 'desc' }

export function useTaskFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo(() => {
    const current = { ...DEFAULTS }
    for (const [key, value] of searchParams.entries()) {
      if (value !== '') current[key] = value
    }
    return current
  }, [searchParams])

  const setFilters = useCallback(
    (updates) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          for (const [key, value] of Object.entries(updates)) {
            if (value === undefined || value === null || value === '') next.delete(key)
            else next.set(key, String(value))
          }
          // Any change to *what* is being listed invalidates the current page
          // number — otherwise filtering while on page 5 shows an empty table.
          if (!('page' in updates)) next.set('page', '1')
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const resetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(DEFAULTS), { replace: true })
  }, [setSearchParams])

  /** Flip direction when re-clicking the active column, else sort descending. */
  const toggleSort = useCallback(
    (field) => {
      const isSame = filters.sort_by === field
      setFilters({
        sort_by: field,
        sort_order: isSame && filters.sort_order === 'desc' ? 'asc' : 'desc',
      })
    },
    [filters.sort_by, filters.sort_order, setFilters],
  )

  return { filters, setFilters, resetFilters, toggleSort }
}
