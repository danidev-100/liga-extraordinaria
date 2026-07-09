"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { ensureScope } from "@/lib/ensure-scope"
import db from "@/lib/db"
import Papa from "papaparse"

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

  const text = await file.text()

  return new Promise((resolve) => {
    Papa.parse<PlayerRow>(text, {
      header: true,
      skipEmptyLines: true,
      trimHeaders: true,
      encoding: "UTF-8",
      complete: async (results) => {
        const result: ImportResult = { created: 0, skipped: 0, errors: [] }

        // Normalize headers
        const rows = results.data.map((row) => ({
          nombre: row.nombre ?? "",
          apellido: row.apellido ?? "",
          dni: row.dni ?? "",
          fechaNacimiento: row.fechaNacimiento ?? row.fecha_nacimiento ?? "",
          camiseta: row.camiseta ?? row.numero ?? "",
        }))

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
            // Check if DNI already exists
            const existing = await db.player.findUnique({ where: { dni: row.dni } })
            if (existing) {
              result.errors.push({ row: rowNum, message: `DNI ${row.dni} ya registrado (${existing.name} ${existing.surname})` })
              result.skipped++
              continue
            }

            const birthDate = row.fechaNacimiento
              ? new Date(row.fechaNacimiento)
              : new Date("2000-01-01")

            const jerseyNumber = row.camiseta
              ? parseInt(row.camiseta, 10)
              : null

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
        resolve(result)
      },
      error(error) {
        throw new Error(`Error al parsear CSV: ${error.message}`)
      },
    })
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
