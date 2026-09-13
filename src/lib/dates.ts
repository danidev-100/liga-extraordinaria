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

/**
 * Extrae las partes de calendario (año, mes 1-based, día) de un valor de fecha
 * SIN corrimiento de zona horaria.
 *
 * Las fechas de nacimiento se guardan como medianoche UTC ("YYYY-MM-DD" → UTC
 * midnight). Si se leen con getters locales (ej. Argentina, UTC-3) se muestran
 * un día antes. Por eso aquí se leen con getters UTC / desde la parte textual
 * ISO, que preservan el día real del dato.
 */
export function datePartsOf(
  value: Date | string | null | undefined,
): { y: number; m: number; d: number } | null {
  if (value === null || value === undefined) return null
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return { y: value.getUTCFullYear(), m: value.getUTCMonth() + 1, d: value.getUTCDate() }
  }
  const s = String(value).trim()
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (iso) return { y: Number(iso[1]), m: Number(iso[2]), d: Number(iso[3]) }
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (dmy) return { y: Number(dmy[3]), m: Number(dmy[2]), d: Number(dmy[1]) }
  const dt = new Date(s)
  if (Number.isNaN(dt.getTime())) return null
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() }
}

/**
 * Devuelve la fecha como "dd/mm/aaaa" (ej. "05/05/1977"), o "" si no hay fecha.
 * Sin corrimiento de zona horaria.
 */
export function formatDateDDMMYYYY(value: Date | string | null | undefined): string {
  const p = datePartsOf(value)
  if (!p) return ""
  const mm = String(p.m).padStart(2, "0")
  const dd = String(p.d).padStart(2, "0")
  return `${dd}/${mm}/${p.y}`
}