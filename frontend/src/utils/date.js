/**
 * Date formatting helpers.
 *
 * The API sends naive-UTC timestamps with an explicit `Z` suffix, so
 * `new Date(value)` parses them unambiguously and every function below
 * renders in the viewer's local timezone.
 */

const DATE_FMT = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const DATETIME_FMT = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function parseDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(value, fallback = '—') {
  const date = parseDate(value)
  return date ? DATE_FMT.format(date) : fallback
}

export function formatDateTime(value, fallback = '—') {
  const date = parseDate(value)
  return date ? DATETIME_FMT.format(date) : fallback
}

const UNITS = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
]

const RELATIVE_FMT = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

/** "3 days ago", "in 2 hours", "just now". */
export function formatRelative(value, fallback = '—') {
  const date = parseDate(value)
  if (!date) return fallback

  const seconds = (date.getTime() - Date.now()) / 1000
  const magnitude = Math.abs(seconds)

  if (magnitude < 45) return 'just now'
  for (const [unit, secondsInUnit] of UNITS) {
    if (magnitude >= secondsInUnit) {
      return RELATIVE_FMT.format(Math.round(seconds / secondsInUnit), unit)
    }
  }
  return RELATIVE_FMT.format(Math.round(seconds / 60), 'minute')
}

export function isPast(value) {
  const date = parseDate(value)
  return date ? date.getTime() < Date.now() : false
}

export function daysUntil(value) {
  const date = parseDate(value)
  if (!date) return null
  return Math.ceil((date.getTime() - Date.now()) / 86400000)
}

/**
 * Convert an API timestamp into the `YYYY-MM-DDTHH:mm` string that
 * `<input type="datetime-local">` requires.
 *
 * `toISOString()` cannot be used here: it converts to UTC, so an IST user
 * editing a 5pm task would see 11:30am in the field. Offsetting by the local
 * timezone first keeps the displayed value the one the user actually set.
 */
export function toDateTimeLocalValue(value) {
  const date = parseDate(value)
  if (!date) return ''
  const offsetMs = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

/** Turn a `datetime-local` field back into an ISO string for the API. */
export function fromDateTimeLocalValue(value) {
  if (!value) return null
  const date = new Date(value) // interpreted as local time, which is intended
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}
