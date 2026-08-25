import { useId } from 'react'
import { cn } from '../../utils/cn'

/**
 * Labelled text input with built-in error and hint slots.
 *
 * The generated id ties <label>, the field, and its error message together
 * via `htmlFor` / `aria-describedby`, so screen readers announce the failure
 * with the field rather than leaving red text floating unattached.
 */
export function Input({
  label,
  error,
  hint,
  icon: Icon,
  className,
  containerClassName,
  required,
  id: providedId,
  ...props
}) {
  const generatedId = useId()
  const id = providedId ?? generatedId
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            aria-hidden="true"
          />
        )}
        <input
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'block w-full rounded-xl border border-slate-200 bg-white py-2 text-sm text-slate-900 shadow-xs transition-colors',
            'placeholder:text-slate-400',
            'focus:border-emerald-500 focus:outline-hidden focus:ring-3 focus:ring-emerald-500/20 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/20',
            'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
            'dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500',
            'dark:disabled:bg-slate-900/40',
            Icon ? 'pl-9.5 pr-3.5' : 'px-3.5',
            error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-500/60',
            className,
          )}
          {...props}
        />
      </div>

      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )}
    </div>
  )
}

export function Textarea({ label, error, hint, className, required, id: providedId, ...props }) {
  const generatedId = useId()
  const id = providedId ?? generatedId
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}
      <textarea
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs transition-colors',
          'placeholder:text-slate-400',
          'focus:border-emerald-500 focus:outline-hidden focus:ring-3 focus:ring-emerald-500/20 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/20',
          'dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500',
          error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20',
          className,
        )}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )}
    </div>
  )
}
