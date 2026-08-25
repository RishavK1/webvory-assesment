import { useCallback, useState } from 'react'
import {
  Building2,
  CheckCircle2,
  Circle,
  Cloud,
  Clock3,
  Database,
  Download,
  Gauge,
  Globe,
  MapPin,
  RefreshCw,
  Server,
  ShieldCheck,
  Timer,
} from 'lucide-react'
import { externalService } from '../services/externalService'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import { formatDateTime } from '../utils/date'
import { cn } from '../utils/cn'
import {
  Avatar,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  LoadingState,
} from '../components/ui'

const RATE_LIMIT_SEGMENTS = 12

export function DirectoryPage() {
  const toast = useToast()
  const { canManageTeam } = useAuth()

  const [selected, setSelected] = useState(new Set())
  const [importing, setImporting] = useState(false)

  const fetchDirectory = useCallback((options) => externalService.directory(options), [])
  const { data, error, loading, refetch } = useAsync(fetchDirectory, [])

  function toggle(externalId) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(externalId)) next.delete(externalId)
      else next.add(externalId)
      return next
    })
  }

  async function handleImport() {
    if (selected.size === 0) return
    setImporting(true)
    try {
      const result = await externalService.importUsers([...selected])
      toast.success(result.message)
      setSelected(new Set())
      refetch()
    } catch (err) {
      toast.error(err?.message ?? 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  if (loading && !data) return <LoadingState label="Connecting to upstream directory API…" />

  const importable = (data?.items ?? []).filter((entry) => !entry.already_imported)
  const rateLimitTotal = data?.meta?.rate_limit_per_minute || 1
  const rateLimitRemaining = data?.meta?.rate_limit_remaining ?? 0
  const filledSegments = Math.round(
    (rateLimitRemaining / rateLimitTotal) * RATE_LIMIT_SEGMENTS,
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white/80 p-4 sm:p-5 shadow-xs backdrop-blur-md dark:border-slate-800/80 dark:bg-[#0e131f]/90">
        <div className="flex items-center gap-3 sm:gap-3.5">
          <span className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-sm shadow-emerald-600/25">
            <Server className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 font-display">
              External Staff Directory
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-sans">
              Live upstream sync via resilient HTTP client. Select staff to import into Webvory.
            </p>
          </div>
        </div>
        <div className="flex w-full sm:w-auto gap-2 sm:gap-2.5">
          <Button variant="secondary" icon={RefreshCw} onClick={refetch} loading={loading} className="flex-1 sm:flex-initial">
            Sync
          </Button>
          {canManageTeam && (
            <Button
              icon={Download}
              onClick={handleImport}
              loading={importing}
              disabled={selected.size === 0}
              className="flex-1 sm:flex-initial"
            >
              Import Selected {selected.size > 0 ? `(${selected.size})` : ''}
            </Button>
          )}
        </div>
      </div>

      {error ? (
        <Card padded={false} className="rounded-2xl">
          <ErrorState error={error} onRetry={refetch} />
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3 items-start">
          <div className="lg:col-span-2 space-y-4">
            {importable.length === 0 && data?.items?.length > 0 && (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  Complete directory synchronized. All external profiles are present in workspace.
                </p>
              </div>
            )}

            <div className="grid gap-3.5 sm:grid-cols-2">
              {(data?.items ?? []).map((entry) => {
                const isSelected = selected.has(entry.external_id)
                const disabled = entry.already_imported || !canManageTeam

                return (
                  <button
                    key={entry.external_id}
                    type="button"
                    onClick={() => !disabled && toggle(entry.external_id)}
                    disabled={disabled}
                    aria-pressed={isSelected}
                    className={cn(
                      'group relative flex flex-col gap-3 rounded-2xl border p-4 text-left shadow-xs',
                      entry.already_imported
                        ? 'border-emerald-200/80 bg-emerald-50/30 dark:border-emerald-950/60 dark:bg-emerald-950/20'
                        : 'border-slate-200/90 bg-white dark:border-slate-800/80 dark:bg-[#0e131f]',
                      !disabled && 'cursor-pointer',
                      isSelected && 'border-emerald-500 ring-2 ring-emerald-500/25 dark:border-emerald-400',
                      disabled && !entry.already_imported && 'opacity-60 cursor-not-allowed',
                    )}
                  >
                    {canManageTeam && !entry.already_imported && (
                      <span
                        className={cn(
                          'absolute right-3.5 top-3.5 flex h-5 w-5 items-center justify-center rounded-full transition-colors',
                          isSelected
                            ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                            : 'bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600',
                        )}
                        aria-hidden="true"
                      >
                        {isSelected ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Circle className="h-3.5 w-3.5" />
                        )}
                      </span>
                    )}

                    <div className="flex items-start gap-3 pr-6">
                      <Avatar name={entry.name} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100 font-display">
                          {entry.name}
                        </p>
                        <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                          {entry.email}
                        </p>
                      </div>
                    </div>

                    <dl className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {entry.company && (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                          <span className="truncate">{entry.company}</span>
                        </div>
                      )}
                      {entry.city && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                          <span className="truncate">{entry.city}</span>
                        </div>
                      )}
                      {entry.website && (
                        <div className="flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                          <span className="truncate">{entry.website}</span>
                        </div>
                      )}
                    </dl>

                    {entry.already_imported && (
                      <div className="-mx-4 -mb-4 mt-1 flex items-center gap-1.5 rounded-b-2xl border-t border-emerald-200/80 bg-emerald-100/60 px-4 py-2 text-[11px] font-bold text-emerald-700 dark:border-emerald-950/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        Imported Member
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {data?.items?.length === 0 && (
              <Card padded={false} className="rounded-2xl">
                <EmptyState
                  icon={Cloud}
                  title="Directory is empty"
                  message="Upstream external provider returned no candidate profiles."
                />
              </Card>
            )}
          </div>

          <Card className="h-fit rounded-2xl border border-slate-200/90 shadow-xs dark:border-slate-800/80 lg:sticky lg:top-20">
            <CardHeader title="Upstream Telemetry" subtitle="Live resilience & circuit metrics" />

            <div className="mt-4 space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 shadow-2xs dark:bg-slate-800 dark:text-slate-400">
                  <Database className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-display">Source Endpoint</p>
                  <p className="mt-0.5 break-all font-mono text-[11px] text-slate-700 dark:text-slate-300">
                    {data?.meta?.source}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 shadow-2xs dark:bg-slate-800 dark:text-slate-400">
                  <Clock3 className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-display">Last Polled</p>
                  <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">
                    {formatDateTime(data?.meta?.fetched_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-2xs',
                    data?.meta?.cached
                      ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300'
                      : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300',
                  )}
                >
                  <Gauge className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-display">Cache Strategy</p>
                  <p className="mt-0.5 font-bold text-slate-900 dark:text-slate-100 font-display">
                    {data?.meta?.cached ? 'Served from LRU Cache' : 'Fresh Upstream Payload'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Cache TTL: {data?.meta?.cache_ttl_seconds}s
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 dark:border-slate-800/80 dark:bg-slate-900/60">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-display">Rate Limit Pool</p>
                <div className="mt-2 flex gap-1" role="img" aria-label={`${rateLimitRemaining} of ${rateLimitTotal} requests remaining this minute`}>
                  {Array.from({ length: RATE_LIMIT_SEGMENTS }).map((_, index) => (
                    <span
                      key={index}
                      className={cn(
                        'h-2 flex-1 rounded-full',
                        index < filledSegments
                          ? 'bg-emerald-500 dark:bg-emerald-400'
                          : 'bg-slate-200 dark:bg-slate-800',
                      )}
                    />
                  ))}
                </div>
                <p className="mt-2 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  {rateLimitRemaining} of {rateLimitTotal} requests remaining this minute
                </p>
              </div>

              <div className="flex items-start gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 shadow-2xs dark:bg-slate-800 dark:text-slate-400">
                  <Timer className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-display">Resilience Policies</p>
                  <ul className="mt-1 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-emerald-500" />8s socket timeout</li>
                    <li className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-emerald-500" />3 retries with exponential backoff & jitter</li>
                    <li className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-emerald-500" />429 and 5xx auto-recovery</li>
                    <li className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-emerald-500" />Dynamic Retry-After compliance</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
