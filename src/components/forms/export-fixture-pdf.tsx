"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileDown, Loader2 } from "lucide-react"
import { getFixtureData } from "@/actions/fixture-pdf"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface Category {
  id: string
  name: string
  league: { name: string }
  _count: { teams: number }
}

interface Props {
  categories: Category[]
}

export function ExportFixturePDF({ categories }: Props) {
  const [categoryId, setCategoryId] = useState("")
  const [loading, setLoading] = useState(false)

  const selectedCat = categories.find((c) => c.id === categoryId)

  async function handleExport() {
    if (!categoryId) {
      toast.error("Seleccioná una categoría")
      return
    }

    setLoading(true)
    try {
      const data = await getFixtureData(categoryId)

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text(`${data.leagueName} — ${data.categoryName}`, 14, 20)

      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.text(`Temporada ${data.season} · ${data.totalMatches} partidos · ${data.rounds.length} fechas`, 14, 27)

      let yOffset = 34

      for (const round of data.rounds) {
        if (yOffset > 260) {
          doc.addPage()
          yOffset = 20
        }

        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(22, 163, 74)
        doc.text(`Jornada ${round.round}`, 14, yOffset)
        doc.setTextColor(0, 0, 0)
        yOffset += 5

        const body = round.matches.map((m) => [
          m.local,
          m.visitor,
          m.date,
          m.time,
          m.court,
          m.status,
        ])

        autoTable(doc, {
          startY: yOffset,
          head: [["Local", "Visitante", "Fecha", "Hora", "Cancha", "Resultado"]],
          body,
          theme: "grid",
          headStyles: { fillColor: [22, 163, 74], textColor: 255, fontSize: 7, fontStyle: "bold" },
          bodyStyles: { fontSize: 7 },
          styles: { cellPadding: 1.5 },
          alternateRowStyles: { fillColor: [240, 253, 244] },
          margin: { left: 14, right: 14 },
          columnStyles: {
            0: { cellWidth: 38 },
            1: { cellWidth: 38 },
            2: { cellWidth: 26 },
            3: { cellWidth: 14 },
            4: { cellWidth: 34 },
            5: { cellWidth: 18 },
          },
        })

        yOffset = (doc as any).lastAutoTable?.finalY ?? yOffset + 25
        yOffset += 6
      }

      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text(
          `Generado el ${new Date().toLocaleDateString("es-AR")} · Liga Extraordinaria`,
          14,
          doc.internal.pageSize.height - 10,
        )
        doc.text(
          `Página ${i} de ${pageCount}`,
          doc.internal.pageSize.width - 14,
          doc.internal.pageSize.height - 10,
          { align: "right" },
        )
      }

      doc.save(`fixture-${data.categoryName.toLowerCase().replace(/\s+/g, "-")}.pdf`)
      toast.success("PDF descargado")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al generar PDF")
    } finally {
      setLoading(false)
    }
  }

  // Filter categories that have matches
  const categoriesWithTeams = categories.filter((c) => c._count.teams >= 2)

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-1.5">
        <label className="text-sm font-medium">Categoría</label>
        <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar categoría...">
              {(value: string | null) => {
                if (!value) return "Seleccionar categoría..."
                const cat = categories.find((c) => c.id === value)
                return cat ? `${cat.name} — ${cat.league.name}` : null
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {categoriesWithTeams.length === 0 ? (
              <SelectItem value="_none" disabled>
                No hay categorías con equipos
              </SelectItem>
            ) : (
              categoriesWithTeams.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name} — {cat.league.name} ({cat._count.teams} equipos)
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
      <Button
        onClick={handleExport}
        disabled={!categoryId || loading}
        variant="outline"
        className="gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileDown className="h-4 w-4" />
        )}
        {loading ? "Generando..." : "Descargar PDF"}
      </Button>
    </div>
  )
}
