import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Logomark } from '../components/layout/Sidebar'
import { Button, Input } from '../components/ui'
import { cn } from '../utils/cn'

const DEMO_ACCOUNTS = [
  { email: 'elena@webvory.com', name: 'Elena Vance', role: 'Admin', initials: 'EV' },
  { email: 'marcus@webvory.com', name: 'Marcus Sterling', role: 'Manager', initials: 'MS' },
  { email: 'kai@webvory.com', name: 'Kai Takahashi', role: 'Member', initials: 'KT' },
]

const FEATURES = [
  'Real-time kanban synchronization with optimistic updates',
  'Automated workload velocity & throughput metrics',
  'External staff directory with resilience telemetry',
]

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

const springTransition = { type: 'spring', stiffness: 220, damping: 24 }

function BrandPanel() {
  return (
    <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#06181b] via-[#092224] to-[#040e10] lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-14 xl:px-16 xl:py-16">
      {/* Decorative ambient glowing orbs */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-emerald-500/15 blur-[120px]" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-cyan-500/15 blur-[120px]" aria-hidden="true" />
      <div className="ambient-mesh pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="ambient-dots pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />

      {/* Brand header */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={fadeUp}
        transition={springTransition}
        className="relative flex items-center gap-3.5"
      >
        <Logomark className="shadow-lg shadow-emerald-950/40" />
        <div>
          <span className="text-base font-extrabold tracking-tight text-white font-display">Webvory</span>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Enterprise Workspace
          </p>
        </div>
      </motion.div>

      {/* Main hero pitch */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={fadeUp}
        transition={{ ...springTransition, delay: 0.08 }}
        className="relative my-8"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          <span>Next-Gen Workflow Platform</span>
        </div>
        <h1 className="mt-5 text-4xl font-extrabold leading-[1.15] tracking-tight text-white font-display xl:text-5xl">
          Execute tasks at <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">peak velocity.</span>
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">
          Webvory powers fast-moving teams with unified project tracking, live status matrix, and real-time operational transparency.
        </p>

        <ul className="mt-8 space-y-3">
          {FEATURES.map((feature, index) => (
            <motion.li
              key={feature}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              transition={{ ...springTransition, delay: 0.14 + index * 0.06 }}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-slate-200">{feature}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* Quote card */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={fadeUp}
        transition={{ ...springTransition, delay: 0.35 }}
        className="relative rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 font-bold text-white text-xs">
            EV
          </div>
          <div>
            <p className="text-xs font-bold text-white">Elena Vance</p>
            <p className="text-[10px] text-emerald-300">Engineering Director & Workspace Admin</p>
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-300">
          "Webvory restructured our entire product delivery velocity. Everything is traceable, intuitive, and remarkably fast."
        </p>
      </motion.div>
    </section>
  )
}

export function LoginPage() {
  const { login, isAuthenticated, initialising } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('elena@webvory.com')
  const [password, setPassword] = useState('password123')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  if (!initialising && isAuthenticated) {
    return <Navigate to={location.state?.from ?? '/'} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email.trim(), password)
      navigate(location.state?.from ?? '/', { replace: true })
    } catch (err) {
      setError(err?.message ?? 'Sign in failed')
    } finally {
      setSubmitting(false)
    }
  }

  function chooseAccount(account) {
    setEmail(account.email)
    setPassword('password123')
    setError(null)
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#070a11]">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-12 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springTransition}
            className="w-full max-w-[430px]"
          >
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <Logomark />
              <div>
                <span className="text-base font-extrabold text-slate-900 dark:text-white font-display">Webvory</span>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                  Workspace
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <Zap className="h-3.5 w-3.5 text-emerald-500" />
              <span>Workspace Portal</span>
            </div>

            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white font-display">
              Sign in to Webvory
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Welcome back. Access your workspace dashboards and task backlogs.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
              <Input
                label="Email address"
                type="email"
                icon={Mail}
                required
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@webvory.com"
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  icon={KeyRound}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter account password"
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute bottom-0 right-0 flex h-9.5 w-10 cursor-pointer items-center justify-center text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-slate-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
                >
                  {error}
                </motion.div>
              )}

              <Button type="submit" loading={submitting} className="w-full mt-2" size="lg" iconRight={ArrowRight}>
                Enter Workspace
              </Button>
            </form>

            <div className="my-7 flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 font-display">
                Instant Demo Access
              </span>
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {DEMO_ACCOUNTS.map((account) => {
                const selected = email === account.email
                return (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => chooseAccount(account)}
                    aria-pressed={selected}
                    className={cn(
                      'group cursor-pointer rounded-xl border p-2.5 text-center transition-all duration-150',
                      selected
                        ? 'border-emerald-500 bg-emerald-50/80 shadow-xs ring-1 ring-emerald-500/30 dark:border-emerald-500/50 dark:bg-emerald-950/40'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700 dark:hover:bg-slate-800/60',
                    )}
                  >
                    <span
                      className={cn(
                        'mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-all',
                        selected
                          ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300',
                      )}
                    >
                      {account.initials}
                    </span>
                    <span className="mt-2 block truncate text-xs font-bold text-slate-800 dark:text-slate-100 font-display">
                      {account.name.split(' ')[0]}
                    </span>
                    <span className="mt-0.5 block text-[10px] font-medium text-slate-400 dark:text-slate-500">
                      {account.role}
                    </span>
                  </button>
                )
              })}
            </div>

            <p className="mt-5 text-center text-[11px] text-slate-400 dark:text-slate-500">
              Demo passwords pre-filled. Select any account to jump right in.
            </p>
          </motion.div>
        </section>

        <BrandPanel />
      </div>
    </main>
  )
}

