"use client"

import { type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

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
  return (
    <form
      action={async () => {
        if (confirm(confirmMessage)) {
          await action()
        }
      }}
    >
      <Button variant="destructive" size="sm" type="submit">
        {children ?? <Trash2 className="h-4 w-4" />}
      </Button>
    </form>
  )
}
