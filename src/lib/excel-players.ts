import * as XLSX from "xlsx"

export interface PlayerImportRow {
  nombre: string
  apellido: string
  dni: string
  fechaNacimiento?: string
  camiseta?: string
}

/** Normaliza un encabezado: minúsculas, sin acentos, sin espacios/símbolos. */
function normalizeHeader(h: string): string {
  return h
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
}

/**
 * Convierte una celda de fecha a AAAA-MM-DD.
 * Soporta celdas Date reales (Excel con cellDates), ISO y dd/mm/aaaa (texto).
 */
function dateOf(v: unknown): string {
  if (v instanceof Date && !isNaN(v.getTime())) {
    return v.toISOString().slice(0, 10)
  }
  const s = String(v ?? "").trim()
  if (!s) return ""
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (dmy) {
    const d = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]))
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  }
  return s
}

/**
 * Lee la primera hoja de un archivo Excel (.xlsx/.xls) y devuelve filas de
 * jugador, resolviendo las columnas por encabezados normalizados (tolera
 * mayúsculas, acentos y variantes como "Fecha de nacimiento" / "Nº").
 */
export function parsePlayersExcel(data: ArrayBuffer | Buffer): PlayerImportRow[] {
  const workbook = XLSX.read(data, { type: "buffer", cellDates: true })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return []

  const grid = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
    header: 1,
    defval: "",
    blankrows: false,
  })
  if (grid.length === 0) return []

  const headers = (grid[0] ?? []).map((h) => normalizeHeader(String(h ?? "")))

  const colOf = (...aliases: string[]): number => {
    for (const alias of aliases) {
      const idx = headers.findIndex((h) => h.includes(alias))
      if (idx >= 0) return idx
    }
    return -1
  }

  const idxNombre = colOf("nombre", "name")
  const idxApellido = colOf("apellido", "surname")
  const idxDni = colOf("dni", "documento")
  const idxFecha = colOf("nacimiento", "birthdate", "birth", "fecha")
  const idxCamiseta = colOf("camiseta", "numero", "dorsal", "jersey", "num")

  const cell = (idx: number, row: unknown[]): string =>
    idx >= 0 ? String(row[idx] ?? "").trim() : ""

  return grid.slice(1).map((row) => ({
    nombre: cell(idxNombre, row),
    apellido: cell(idxApellido, row),
    dni: cell(idxDni, row),
    fechaNacimiento: idxFecha >= 0 ? dateOf(row[idxFecha]) : "",
    camiseta: cell(idxCamiseta, row),
  }))
}