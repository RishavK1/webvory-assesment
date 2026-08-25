import { useEffect, useRef, useState } from 'react'

/**
 * Count a number up from zero when it first appears.
 *
 * Animated figures are easy to overdo — this stays short, eases out, and lands
 * exactly on the target rather than approaching it. It also respects
 * `prefers-reduced-motion` by skipping straight to the value, since counting
 * digits is exactly the kind of motion that setting exists to suppress.
 */
export function useCountUp(target, { duration = 650 } = {}) {
  const [value, setValue] = useState(target)
  const frameRef = useRef(null)
  const previousRef = useRef(target)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced || typeof target !== 'number') {
      setValue(target)
      previousRef.current = target
      return undefined
    }

    const from = previousRef.current
    const delta = target - from
    if (delta === 0) return undefined

    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - progress) ** 3 // ease-out cubic
      setValue(Math.round(from + delta * eased))
      if (progress < 1) frameRef.current = requestAnimationFrame(tick)
      else previousRef.current = target
    }
    frameRef.current = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(frameRef.current)
  }, [target, duration])

  return value
}
