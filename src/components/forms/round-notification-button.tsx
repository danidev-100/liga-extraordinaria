"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Megaphone, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { setRoundNotification, deleteRoundNotification } from "@/actions/round-notification"

interface RoundNotificationButtonProps {
  categoryId: string
  round: number
  message?: string
  /** League slug when rendered from a scoped admin page. */
  leagueSlug?: string
  label?: string
}

export function RoundNotificationButton({
  categoryId,
  round,
  message,
  leagueSlug,
  label,
}: RoundNotificationButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(message ?? "")
  const [submitting, setSubmitting] = useState(false)
  const hasNotification = Boolean(message && message.trim())

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (v) setText(message ?? "")
  }

  async function handleSave() {
    setSubmitting(true)
    try {
      await setRoundNotification(categoryId, round, text, leagueSlug)
      toast.success(text.trim() ? "Notificación guardada" : "Notificación eliminada")
      setOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    setSubmitting(true)
    try {
      await deleteRoundNotification(categoryId, round, leagueSlug)
      toast.success("Notificación eliminada")
      setOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger
          render={
            <Button type="button" variant="outline" size="sm">
              <Megaphone className="h-3.5 w-3.5" />
              {hasNotification ? "Editar notificación" : "Notificación"}
            </Button>
          }
        />
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {hasNotification ? "Editar notificación" : "Nueva notificación"}
            </DialogTitle>
            <DialogDescription>
              Este aviso se muestra al inicio de la jornada en la página pública de partidos.
            </DialogDescription>
          </DialogHeader>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribí el aviso para esta jornada..."
            className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30"
          />

          <DialogFooter>
            {hasNotification && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={submitting}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Quitar notificación
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave} disabled={submitting}>
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}