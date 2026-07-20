"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { FileDown, Loader2 } from "lucide-react"
import { getFixtureData } from "@/actions/fixture-pdf"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface Props {
  categoryId: string
  variant?: "default" | "outline"
}

export function DownloadFixturePDF({ categoryId, variant = "outline" }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const data = await getFixtureData(categoryId)

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

      // Title
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

        // Round label
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

      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text(
          `Generado el ${new Date().toLocaleDateString("es-AR")} · Torneo Pro`,
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

      doc.save(`fixture-${data.categoryName.toLowerCase().replace(/\s+/g, "-")}-${data.season}.pdf`)
      toast.success("PDF descargado exitosamente")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al generar el PDF")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant={variant} onClick={handleDownload} disabled={loading}>
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="mr-2 h-4 w-4" />
      )}
      {loading ? "Generando PDF..." : "Descargar PDF"}
    </Button>
  )
}
