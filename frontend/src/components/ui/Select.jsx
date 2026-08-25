import { useId } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn'

/**
 * Native <select> in the app's visual language.
 *
 * Deliberately native rather than a custom dropdown: it gets keyboard
 * support, type-ahead and the correct mobile picker for free.
 */
export function Select({
  label,
  error,
  hint,
  options = [],
  placeholder,
  className,
  containerClassName,
  required,
  id: providedId,
  ...props
}) {
  const generatedId = useId()
  const id = providedId ?? generatedId

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
        <select
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            'block w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3.5 pr-9 text-sm',
            'text-slate-900 shadow-xs transition-colors',
            'focus:border-emerald-500 focus:outline-hidden focus:ring-3 focus:ring-emerald-500/20 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/20',
            'disabled:cursor-not-allowed disabled:bg-slate-50',
            'dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-100 dark:disabled:bg-slate-900/40',
            error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20',
            className,
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          aria-hidden="true"
        />
      </div>

      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      )}
    </div>
  )
}
