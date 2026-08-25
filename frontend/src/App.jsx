import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './hooks/useToast'
import { LoadingState } from './components/ui'
import { BoardPage } from './pages/BoardPage'
import { DashboardPage } from './pages/DashboardPage'
import { DirectoryPage } from './pages/DirectoryPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { TaskDetailPage } from './pages/TaskDetailPage'
import { TasksPage } from './pages/TasksPage'
import { TeamPage } from './pages/TeamPage'

/**
 * Gate for authenticated routes.
 *
 * While the stored token is being re-validated we render a loading state
 * rather than redirecting — otherwise a refresh on /tasks would bounce the
 * user to /login for a moment before bouncing them back.
 */
function RequireAuth({ children }) {
  const { isAuthenticated, initialising } = useAuth()
  const location = useLocation()

  if (initialising) return <LoadingState label="Restoring your session…" className="min-h-screen" />

  if (!isAuthenticated) {
    // Remember where they were headed so login can return them there.
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />
  }

  return children
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="tasks/:taskId" element={<TaskDetailPage />} />
            <Route path="board" element={<BoardPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="directory" element={<DirectoryPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}
