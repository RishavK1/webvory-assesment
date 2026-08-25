import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authService } from '../services/authService'
import { setUnauthorizedHandler, tokenStorage } from '../services/apiClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initialising, setInitialising] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      if (!tokenStorage.get()) {
        setInitialising(false)
        return
      }
      try {
        const current = await authService.me()
        if (!cancelled) setUser(current)
      } catch {
        tokenStorage.clear()
      } finally {
        if (!cancelled) setInitialising(false)
      }
    }

    restoreSession()
    return () => {
      cancelled = true
    }
  }, [])

  // Lets apiClient drop the session from anywhere on a 401, without the
  // service layer needing to know about React.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null))
    return () => setUnauthorizedHandler(null)
  }, [])

  const login = useCallback(async (email, password) => {
    const signedIn = await authService.login(email, password)
    setUser(signedIn)
    return signedIn
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      initialising,
      isAuthenticated: Boolean(user),
      login,
      logout,
      /** Server-side checks are the real guard; this only hides UI. */
      hasRole: (...roles) => Boolean(user && roles.includes(user.role)),
      canManageTeam: Boolean(user && ['admin', 'manager'].includes(user.role)),
    }),
    [user, initialising, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside an <AuthProvider>')
  return context
}
