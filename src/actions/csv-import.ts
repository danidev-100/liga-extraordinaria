"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { ensureScope } from "@/lib/ensure-scope"
import db from "@/lib/db"
import Papa from "papaparse"
import { parsePlayersExcel } from "@/lib/excel-players"

interface PlayerRow {
  nombre: string
  apellido: string
  dni: string
  fechaNacimiento?: string
  fecha_nacimiento?: string
  camiseta?: string
  numero?: string
}

export interface ImportResult {
  created: number
  updated: number
  skipped: number
  errors: { row: number; message: string }[]
}

export async function importPlayersFromCSV(
  formData: FormData,
  slug?: string,
): Promise<ImportResult> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

  const file = formData.get("file") as File
  if (!file) throw new Error("No se recibió ningún archivo")

  const teamId = formData.get("teamId") as string
  if (!teamId) throw new Error("Debe seleccionar un equipo")

  const fileName = file.name.toLowerCase()
  const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls")

  let rows: PlayerRow[]

  if (isExcel) {
    const buffer = Buffer.from(await file.arrayBuffer())
    rows = parsePlayersExcel(buffer)
  } else {
    const text = await file.text()
    const parsed = Papa.parse<PlayerRow>(text, {
      header: true,
      skipEmptyLines: true,
      trimHeaders: true,
      encoding: "UTF-8",
    })

    if (parsed.errors.length > 0) {
      throw new Error(`Error al parsear CSV: ${parsed.errors[0].message}`)
    }

    rows = parsed.data.map((row) => ({
      nombre: row.nombre ?? "",
      apellido: row.apellido ?? "",
      dni: row.dni ?? "",
      fechaNacimiento: row.fechaNacimiento ?? row.fecha_nacimiento ?? "",
      camiseta: row.camiseta ?? row.numero ?? "",
    }))
  }

  const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] }

  // Deactivate all current players — the import file is the new source of truth
  await db.player.updateMany({
    where: { teamId },
    data: { isActive: false },
  })

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2 // 1-indexed + header row

    if (!row.nombre || !row.apellido || !row.dni) {
      result.errors.push({ row: rowNum, message: "Faltan campos requeridos (nombre, apellido, dni)" })
      result.skipped++
      continue
    }

    if (row.dni.length < 5) {
      result.errors.push({ row: rowNum, message: `DNI inválido: "${row.dni}"` })
      result.skipped++
      continue
    }

    try {
      const birthDate = row.fechaNacimiento
        ? new Date(row.fechaNacimiento)
        : new Date("2000-01-01")

      // Reject malformed or out-of-range birth dates instead of storing garbage.
      if (Number.isNaN(birthDate.getTime()) || birthDate.getFullYear() < 1900 || birthDate.getTime() > Date.now()) {
        result.errors.push({
          row: rowNum,
          message: `Fecha de nacimiento inválida: "${row.fechaNacimiento ?? ""}"`,
        })
        result.skipped++
        continue
      }

      const jerseyNumber = row.camiseta
        ? parseInt(row.camiseta, 10)
        : null

      // Check if DNI already exists
      const existing = await db.player.findUnique({ where: { dni: row.dni } })
      if (existing) {
        if (existing.teamId === teamId) {
          // Already in this team — reactivate and update data
          await db.player.update({
            where: { id: existing.id },
            data: {
              isActive: true,
              name: row.nombre.trim(),
              surname: row.apellido.trim(),
              birthDate,
              jerseyNumber: jerseyNumber && !isNaN(jerseyNumber) ? jerseyNumber : null,
            },
          })
          result.updated++
          continue
        }
        // Move to this team
        await db.player.update({
          where: { id: existing.id },
          data: { teamId, isActive: true },
        })
        result.updated++
        continue
      }

      await db.player.create({
        data: {
          name: row.nombre.trim(),
          surname: row.apellido.trim(),
          dni: row.dni.trim(),
          birthDate,
          jerseyNumber: jerseyNumber && !isNaN(jerseyNumber) ? jerseyNumber : null,
          teamId,
        },
      })

      result.created++
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error desconocido"
      result.errors.push({ row: rowNum, message: msg })
      result.skipped++
    }
  }

  revalidatePath("/admin/players")
  if (slug) revalidatePath(`/admin/ligas/${slug}/players`)
  return result
}

export interface TeamPlayerExport {
  id: string
  name: string
  surname: string
  dni: string
  birthDate: Date
  jerseyNumber: number | null
  isActive: boolean
}

export async function getTeamPlayers(teamId: string): Promise<TeamPlayerExport[]> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

  return db.player.findMany({
    where: { teamId },
    orderBy: [{ surname: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      surname: true,
      dni: true,
      birthDate: true,
      jerseyNumber: true,
      isActive: true,
    },
  })
}

export async function getTeamsForCSV(leagueId?: string) {
  const session = await auth()
  if (!session?.user?.id) return []

  return db.team.findMany({
    where: leagueId ? { category: { leagueId } } : undefined,
    include: {
      category: { select: { name: true } },
    },
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  })
}
