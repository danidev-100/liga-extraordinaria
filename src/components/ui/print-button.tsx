"use client"

import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PrintButtonProps {
  label?: string
}

export function PrintButton({ label = "Imprimir / PDF" }: PrintButtonProps) {
  return (
    <Button variant="outline" onClick={() => window.print()} className="gap-2 print:hidden">
      <Printer className="h-4 w-4" />
      {label}
    </Button>
  )
}
