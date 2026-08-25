import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button, EmptyState } from '../components/ui'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[65vh] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/90 bg-white/80 p-8 shadow-xs backdrop-blur-md dark:border-slate-800/80 dark:bg-[#0e131f]/90">
        <EmptyState
          icon={Compass}
          title="Page Not Found"
          message="The requested route does not exist or has been relocated within the workspace."
          action={
            <Link to="/">
              <Button>Return to Dashboard</Button>
            </Link>
          }
        />
      </div>
    </div>
  )
}
