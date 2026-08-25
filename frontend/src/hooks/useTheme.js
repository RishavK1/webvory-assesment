import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'webvory.theme'

/**
 * Light/dark theme, shared across every component that asks for it.
 *
 * This deliberately does *not* use `useState`. An earlier version did, and it
 * had a real bug: each component calling the hook owned a private copy of the
 * value, so toggling from the topbar flipped the topbar's copy and the `<html>`
 * class — but the dashboard's copy never heard about it and its charts kept
 * rendering light-mode hexes on a dark surface.
 *
 * The DOM class is the single source of truth, and `useSyncExternalStore`
 * subscribes every consumer to it, so one toggle re-renders all of them.
 */
const listeners = new Set()

function readTheme() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Private browsing and a full quota both reject writes; the theme still
    // applies for this session.
  }
  listeners.forEach((listener) => listener())
}

export function useTheme() {
  // getSnapshot returns a primitive, so React's identity check is a value
  // comparison and cannot loop.
  const theme = useSyncExternalStore(subscribe, readTheme, () => 'light')

  const toggle = useCallback(() => {
    applyTheme(readTheme() === 'dark' ? 'light' : 'dark')
  }, [])

  const setTheme = useCallback((next) => applyTheme(next), [])

  return { theme, toggle, setTheme, isDark: theme === 'dark' }
}
