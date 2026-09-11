"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Loader2, Wrench } from "lucide-react"
import { repairCategoryMatches } from "@/actions/fixture-repair"

interface RepairCategoryButtonProps {
  categoryId: string
  label?: string
}

export function RepairCategoryButton({
  categoryId,
  label = "Reparar cruces repetidos",
}: RepairCategoryButtonProps) {
  const [working, setWorking] = useState(false)

  async function handleRepair() {
    if (
      !confirm(
        "¿Reacomodar el fixture para eliminar los cruces repetidos? Se pueden modificar varios partidos de las jornadas siguientes.",
      )
    ) {
      return
    }
    setWorking(true)
    try {
      const result = await repairCategoryMatches(categoryId)
      toast.success(
        result.fixed > 0
          ? `Se reacomodaron ${result.fixed} partido${result.fixed !== 1 ? "s" : ""} para eliminar cruces repetidos`
          : "No había cruces repetidos",
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo reparar el fixture")
    } finally {
      setWorking(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleRepair} disabled={working}>
      {working ? (
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
      ) : (
        <Wrench className="mr-1.5 h-4 w-4" />
      )}
      {label}
    </Button>
  )
}