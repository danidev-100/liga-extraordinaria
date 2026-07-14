"use client"

import { useState, useRef } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Upload, Download, FileSpreadsheet, Loader2, AlertTriangle, CheckCircle2,
} from "lucide-react"
import { importPlayersFromCSV, type ImportResult } from "@/actions/csv-import"
import * as XLSX from "xlsx"

interface Player {
  id: string
  name: string
  surname: string
  dni: string
  jerseyNumber: number | null
  isActive: boolean
}

interface Props {
  teamId: string
  teamName: string
  players: Player[]
}

export function TeamPlayerSection({ teamId, teamName, players }: Props) {
  const router = useRouter()
  const [importOpen, setImportOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<Record<string, string>[] | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [exporting, setExporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return

    setFile(f)
    setResult(null)

    const isExcel = f.name.toLowerCase().endsWith(".xlsx") || f.name.toLowerCase().endsWith(".xls")

    if (isExcel) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" })
        setPreview(json.slice(0, 5))
      }
      reader.readAsArrayBuffer(f)
    } else {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const text = ev.target?.result as string
        const lines = text.split("\n").slice(0, 6)
        const headers = lines[0].split(",").map((h) => h.trim())
        const data = lines.slice(1).filter(Boolean).map((line) => {
          const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""))
          const row: Record<string, string> = {}
          headers.forEach((h, i) => { row[h] = values[i] ?? "" })
          return row
        })
        setPreview(data)
      }
      reader.readAsText(f)
    }
  }

  async function handleImport() {
    if (!file) {
      toast.error("Seleccioná un archivo")
      return
    }

    setImporting(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("teamId", teamId)

      const res = await importPlayersFromCSV(formData)
      setResult(res)

      if (res.created > 0) {
        toast.success(`${res.created} jugadores importados`)
        router.refresh()
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

  async function handleExport() {
    setExporting(true)
    try {
      const wb = XLSX.utils.book_new()
      const wsData = [
        ["Nombre", "Apellido", "DNI", "Camiseta", "Activo"],
        ...players.map((p) => [
          p.name,
          p.surname,
          p.dni,
          p.jerseyNumber ?? "",
          p.isActive ? "Sí" : "No",
        ]),
      ]
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      ws["!cols"] = [
        { wch: 20 }, { wch: 20 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 10 },
      ]
      XLSX.utils.book_append_sheet(wb, ws, "Jugadores")
      XLSX.writeFile(wb, `jugadores-${teamName.toLowerCase().replace(/\s+/g, "-")}.xlsx`)
      toast.success("Excel descargado")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al exportar")
    } finally {
      setExporting(false)
    }
  }

  function resetImport() {
    setFile(null)
    setPreview(null)
    setResult(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-heading text-base font-semibold">
            Jugadores ({players.length})
          </h3>
          <p className="text-sm text-muted-foreground">
            Gestioná la plantilla del equipo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="mr-1.5 h-3.5 w-3.5" />
            )}
            Exportar Excel
          </Button>

          <Dialog open={importOpen} onOpenChange={(v) => { setImportOpen(v); if (!v) resetImport() }}>
            <DialogTrigger className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted">
              <Upload className="h-3.5 w-3.5" />
              Importar
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Importar jugadores</DialogTitle>
                <DialogDescription>
                  Subí un archivo <strong>CSV</strong> o <strong>Excel (.xlsx)</strong> con las columnas:{" "}
                  nombre, apellido, dni. Opcional: fechaNacimiento (AAAA-MM-DD), camiseta.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* File upload */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Archivo *</label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/50 flex-1 justify-center">
                    <FileSpreadsheet className="h-6 w-6" />
                    <span>{file ? file.name : "Hacé clic para seleccionar CSV o Excel"}</span>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFile}
                      className="hidden"
                    />
                  </label>
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
                            <th className="px-3 py-2 text-left font-medium">Camiseta</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.map((row, i) => (
                            <tr key={i} className="border-t">
                              <td className="px-3 py-2">{row.nombre || row.Nombre || ""}</td>
                              <td className="px-3 py-2">{row.apellido || row.Apellido || ""}</td>
                              <td className="px-3 py-2">{row.dni || row.DNI || ""}</td>
                              <td className="px-3 py-2">{row.camiseta || row.numero || row.Camiseta || ""}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleImport}
                  disabled={!file || importing}
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
                    result.created > 0 || result.updated > 0
                      ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
                      : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
                  }`}>
                    <div className="flex items-center gap-2">
                      {result.created > 0 || result.updated > 0 ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                      <p className="text-sm font-medium">Resultado</p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {result.created > 0 && (
                        <Badge variant="default" className="bg-green-600">
                          {result.created} creados
                        </Badge>
                      )}
                      {result.updated > 0 && (
                        <Badge variant="default" className="bg-blue-600">
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

                {/* Template download */}
                <div className="text-center text-xs text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => {
                      const wb = XLSX.utils.book_new()
                      const ws = XLSX.utils.aoa_to_sheet([
                        ["nombre", "apellido", "dni", "fechaNacimiento", "camiseta"],
                        ["Juan", "Pérez", "12345678", "2005-06-15", "10"],
                        ["María", "García", "87654321", "2006-03-22", "7"],
                      ])
                      XLSX.utils.book_append_sheet(wb, ws, "Plantilla")
                      XLSX.writeFile(wb, "plantilla-jugadores.xlsx")
                    }}
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <Download className="h-3 w-3" />
                    Descargar plantilla Excel
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Players table */}
      {players.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No hay jugadores en este equipo. Importalos desde Excel o CSV.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-xs font-medium text-muted-foreground">
                <th className="px-3 py-2.5 text-left">Nombre</th>
                <th className="px-3 py-2.5 text-left">Apellido</th>
                <th className="px-3 py-2.5 text-left">DNI</th>
                <th className="px-3 py-2.5 text-center">Camiseta</th>
                <th className="px-3 py-2.5 text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.id} className="border-t transition-colors hover:bg-muted/30">
                  <td className="px-3 py-2.5 font-medium">{p.name}</td>
                  <td className="px-3 py-2.5">{p.surname}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{p.dni}</td>
                  <td className="px-3 py-2.5 text-center">
                    {p.jerseyNumber ? (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {p.jerseyNumber}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Badge variant={p.isActive ? "default" : "secondary"} className="text-xs">
                      {p.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
