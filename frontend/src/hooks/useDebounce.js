import { useEffect, useState } from 'react'

/**
 * Delay a rapidly-changing value.
 *
 * Used by the task search box so typing a query issues one request instead
 * of seven.
 */
export function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
