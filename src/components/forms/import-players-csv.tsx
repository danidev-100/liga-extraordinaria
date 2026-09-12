"use client"

import { useState, useRef } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Upload, FileSpreadsheet, Loader2, AlertTriangle, CheckCircle2, Download } from "lucide-react"
import { importPlayersFromCSV, type ImportResult } from "@/actions/csv-import"
import Papa from "papaparse"
import * as XLSX from "xlsx"

interface TeamOption {
  id: string
  name: string
  shortName: string
  category: { name: string }
}

interface PreviewRow {
  nombre: string
  apellido: string
  dni: string
  fechaNacimiento?: string
  camiseta?: string
}

/** Normaliza celdas de fecha de Excel (Date real) y texto a AAAA-MM-DD o texto plano. */
function formatDateCell(v: unknown): string {
  if (v instanceof Date && !isNaN(v.getTime())) {
    return v.toISOString().slice(0, 10)
  }
  return String(v ?? "")
}

function isExcelFile(name: string): boolean {
  return /\.(xlsx|xls)$/i.test(name)
}

export function ImportPlayersCSV({
  teams: initialTeams,
  leagueSlug,
}: {
  teams?: TeamOption[]
  /** League slug when rendered from a scoped admin page (refreshes that list). */
  leagueSlug?: string
}) {
  const [open, setOpen] = useState(false)
  const [teams, setTeams] = useState<TeamOption[]>(initialTeams ?? [])
  const [selectedTeamId, setSelectedTeamId] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<PreviewRow[] | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return

    setFile(f)
    setResult(null)

    const parsePreview = async (): Promise<PreviewRow[]> => {
      if (isExcelFile(f.name)) {
        const buf = await f.arrayBuffer()
        const workbook = XLSX.read(buf, { type: "array", cellDates: true })
        const sheetName = workbook.SheetNames[0]
        if (!sheetName) return []
        const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], {
          defval: "",
        })
        return raw.slice(0, 5).map((r) => ({
          nombre: String(r.nombre ?? r.Nombre ?? ""),
          apellido: String(r.apellido ?? r.Apellido ?? ""),
          dni: String(r.dni ?? r.DNI ?? r.documento ?? ""),
          fechaNacimiento: formatDateCell(r.fechaNacimiento ?? r.fecha_nacimiento ?? r.FechaNacimiento ?? ""),
          camiseta: String(r.camiseta ?? r.numero ?? r.Camiseta ?? r.Numero ?? ""),
        }))
      }

      const text = await f.text()
      const parsed = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        preview: 5,
      })
      return parsed.data.map((r) => ({
        nombre: r.nombre ?? r.Nombre ?? "",
        apellido: r.apellido ?? r.Apellido ?? "",
        dni: r.dni ?? r.DNI ?? r.documento ?? "",
        fechaNacimiento: r.fechaNacimiento ?? r.fecha_nacimiento ?? r.FechaNacimiento ?? "",
        camiseta: r.camiseta ?? r.numero ?? r.Camiseta ?? r.Numero ?? "",
      }))
    }

    parsePreview()
      .then((rows) => setPreview(rows))
      .catch(() => setPreview([]))
  }

  async function handleImport() {
    if (!file || !selectedTeamId) {
      toast.error("Seleccioná un equipo y un archivo Excel o CSV")
      return
    }

    setImporting(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("teamId", selectedTeamId)

      const res = await importPlayersFromCSV(formData, leagueSlug)
      setResult(res)

      if (res.created > 0) {
        toast.success(`${res.created} jugadores importados`)
      }
      if (res.errors.length > 0) {
        toast.error(`${res.errors.length} errores`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al importar")
    } finally {
      setImporting(false)
    }
  }

  function reset() {
    setFile(null)
    setPreview(null)
    setResult(null)
    setSelectedTeamId("")
    if (fileRef.current) fileRef.current.value = ""
  }

  function downloadXlsxTemplate() {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([
      ["nombre", "apellido", "dni", "fechaNacimiento", "camiseta"],
      ["Juan", "Pérez", "12345678", "2005-06-15", "10"],
      ["María", "García", "87654321", "2006-03-22", "7"],
    ])
    XLSX.utils.book_append_sheet(wb, ws, "Jugadores")
    XLSX.writeFile(wb, "plantilla-jugadores.xlsx")
  }

  function downloadCsvTemplate() {
    const csv = "nombre,apellido,dni,fechaNacimiento,camiseta\nJuan,Pérez,12345678,2005-06-15,10\nMaría,García,87654321,2006-03-22,7"
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "plantilla-jugadores.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">
        <Upload className="h-4 w-4" />
        Importar Excel / CSV
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Importar jugadores desde Excel o CSV</DialogTitle>
          <DialogDescription>
            Subí un archivo <strong>Excel (.xlsx)</strong> o CSV con las columnas en este orden:{" "}
            <strong>nombre, apellido, dni, fechaNacimiento (AAAA-MM-DD), camiseta</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Team selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Equipo *</label>
            <Select value={selectedTeamId} onValueChange={(v) => setSelectedTeamId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar equipo..." />
              </SelectTrigger>
              <SelectContent>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.shortName} — {t.category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File upload */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Archivo Excel o CSV *</label>
            <div className="flex items-center gap-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/50 flex-1 justify-center">
                <FileSpreadsheet className="h-6 w-6" />
                <span>{file ? file.name : "Hacé clic para seleccionar Excel o CSV"}</span>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Preview */}
          {preview && preview.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Vista previa (primeros {preview.length} registros)</p>
              <div className="overflow-x-auto rounded-lg border text-xs">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted">
                      <th className="px-3 py-2 text-left font-medium">Nombre</th>
                      <th className="px-3 py-2 text-left font-medium">Apellido</th>
                      <th className="px-3 py-2 text-left font-medium">DNI</th>
                      <th className="px-3 py-2 text-left font-medium">Nacimiento</th>
                      <th className="px-3 py-2 text-left font-medium">Camiseta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2">{row.nombre}</td>
                        <td className="px-3 py-2">{row.apellido}</td>
                        <td className="px-3 py-2">{row.dni}</td>
                        <td className="px-3 py-2">{row.fechaNacimiento || ""}</td>
                        <td className="px-3 py-2">{row.camiseta || ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import button */}
          <Button
            onClick={handleImport}
            disabled={!file || !selectedTeamId || importing}
            className="w-full"
          >
            {importing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {importing ? "Importando..." : "Importar jugadores"}
          </Button>

          {/* Result */}
          {result && (
            <div className={`rounded-lg border p-4 ${
              result.created > 0
                ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
                : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
            }`}>
              <div className="flex items-center gap-2">
                {result.created > 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                )}
                <p className="text-sm font-medium">
                  Resultado de la importación
                </p>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="default" className="bg-green-600">
                  {result.created} creados
                </Badge>
                {result.updated > 0 && (
                  <Badge variant="secondary">
                    {result.updated} actualizados
                  </Badge>
                )}
                {result.skipped > 0 && (
                  <Badge variant="destructive">
                    {result.skipped} omitidos
                  </Badge>
                )}
              </div>
              {result.errors.length > 0 && (
                <div className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-red-600 dark:text-red-400">
                      Fila {err.row}: {err.message}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Template downloads */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={downloadXlsxTemplate}
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <Download className="h-3 w-3" />
              Descargar plantilla Excel
            </button>
            <button
              type="button"
              onClick={downloadCsvTemplate}
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <Download className="h-3 w-3" />
              Descargar plantilla CSV
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}