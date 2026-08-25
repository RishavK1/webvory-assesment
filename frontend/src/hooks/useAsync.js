import { useCallback, useEffect, useRef, useState } from 'react'

export function useAsync(asyncFn, deps = [], { immediate = true } = {}) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(immediate)

  const mountedRef = useRef(true)
  const controllerRef = useRef(null)
  const fnRef = useRef(asyncFn)
  fnRef.current = asyncFn

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      controllerRef.current?.abort()
    }
  }, [])

  const execute = useCallback(async () => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    setLoading(true)
    setError(null)
    try {
      const result = await fnRef.current({ signal: controller.signal })
      if (mountedRef.current && !controller.signal.aborted) {
        setData(result)
        setError(null)
      }
      return result
    } catch (err) {
      // A deliberate abort is not a failure the user should see.
      if (controller.signal.aborted || err?.code === 'timeout') return null
      if (mountedRef.current) setError(err)
      return null
    } finally {
      if (mountedRef.current && !controller.signal.aborted) setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    if (immediate) execute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute, immediate])

  return { data, error, loading, refetch: execute, setData }
}
