/**
 * Safe date helpers.
 *
 * Dates coming from the database can be invalid (e.g. a malformed CSV import
 * stored a timestamp with an out-of-range year). Serialising them with
 * `toISOString()` would throw and crash a server component, so every
 * user-facing date conversion goes through these guards.
 */

/**
 * Returns the ISO string of a date, or `null` when the date is missing or
 * invalid (NaN timestamp). Never throws.
 */
export function toSafeIsoDate(date: Date | string | null | undefined): string | null {
  if (date === null || date === undefined) return null
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

/**
 * Returns true only when the value is a real, usable date.
 */
export function isValidDate(date: Date | string | null | undefined): date is Date | string {
  if (date === null || date === undefined) return false
  const d = date instanceof Date ? date : new Date(date)
  return !Number.isNaN(d.getTime())
}