"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Loader2, Check } from "lucide-react"
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
import { cn } from "@/lib/utils"
import { createFreeMatch } from "@/actions/match-order"

export interface FreeTeamOption {
  id: string
  name: string
  shortName: string
}

interface FreeMatchButtonProps {
  categoryId: string
  round: number
  freeTeams: FreeTeamOption[]
  /** League slug when rendered from a scoped admin page. */
  leagueSlug?: string
}

/**
 * Arma un partido entre dos equipos que quedaron libres en una jornada.
 */
export function FreeMatchButton({ categoryId, round, freeTeams, leagueSlug }: FreeMatchButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function reset() {
    setSelected(new Set())
    setOpen(false)
    setSubmitting(false)
  }

  async function confirm() {
    if (selected.size !== 2) return
    const [localTeamId, visitorTeamId] = Array.from(selected)
    setSubmitting(true)
    try {
      const result = await createFreeMatch(categoryId, round, localTeamId, visitorTeamId, leagueSlug)
      if (result?.created) {
        toast.success("Partido creado entre los equipos libres")
      }
      reset()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear el partido")
    } finally {
      setSubmitting(false)
    }
  }

  const ordered = [...freeTeams].sort((a, b) => a.name.localeCompare(b.name))
  const local = ordered.find((t) => selected.has(t.id) && Array.from(selected)[0] === t.id)
  const visitor = ordered.find((t) => selected.has(t.id) && Array.from(selected)[1] === t.id)

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) setSelected(new Set())
      }}
    >
      <DialogTrigger className="inline-flex items-center gap-1.5 rounded-lg border border-dashed px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
        <Plus className="h-3.5 w-3.5" />
        Hacer partido
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Armar partido entre libres</DialogTitle>
          <DialogDescription>
            Elegí los dos equipos libres de la Jornada {round} para crear el partido.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          {ordered.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No hay equipos libres en esta jornada.
            </p>
          ) : (
            ordered.map((t) => {
              const isSel = selected.has(t.id)
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggle(t.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                    isSel
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border hover:bg-muted",
                  )}
                >
                  {isSel && <Check className="h-3.5 w-3.5 text-primary" />}
                  {t.name}
                </button>
              )
            })
          )}
        </div>

        {selected.size === 2 && (
          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <p className="mb-1 font-medium">Nuevo partido:</p>
            <p>
              {local?.name} <span className="text-muted-foreground">vs</span> {visitor?.name}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={confirm} disabled={selected.size !== 2 || submitting}>
            {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Crear partido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}