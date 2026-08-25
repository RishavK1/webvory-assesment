/**
 * Join class names, dropping falsy values.
 *
 * Keeps conditional Tailwind classes readable:
 *   cn('px-3 py-2', isActive && 'bg-indigo-600', disabled && 'opacity-50')
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
