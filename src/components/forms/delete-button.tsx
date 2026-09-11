"use client"

import { type ReactNode, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Loader2, Trash2 } from "lucide-react"

interface DeleteButtonProps {
  action: () => Promise<void>
  confirmMessage?: string
  children?: ReactNode
}

export function DeleteButton({
  action,
  confirmMessage = "¿Eliminar este elemento?",
  children,
}: DeleteButtonProps) {
  const [deleting, setDeleting] = useState(false)

  return (
    <form
      action={async () => {
        if (!confirm(confirmMessage)) return
        setDeleting(true)
        try {
          await action()
          toast.success("Eliminado correctamente")
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "No se pudo eliminar")
        } finally {
          setDeleting(false)
        }
      }}
    >
      <Button variant="destructive" size="sm" type="submit" disabled={deleting}>
        {deleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          children ?? <Trash2 className="h-4 w-4" />
        )}
      </Button>
    </form>
  )
}
