"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeftRight, Loader2, Check } from "lucide-react"
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
import { swapMatchTeams } from "@/actions/match-order"

export interface SwapCandidate {
  id: string
  localName: string
  visitorName: string
}

interface SwapRivalsButtonProps {
  matchId: string
  localName: string
  visitorName: string
  candidates: SwapCandidate[]
  /** League slug when rendered from a scoped admin page. */
  leagueSlug?: string
}

export function SwapRivalsButton({
  matchId,
  localName,
  visitorName,
  candidates,
  leagueSlug,
}: SwapRivalsButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const selected = candidates.find((c) => c.id === selectedId) ?? null

  function reset() {
    setSelectedId(null)
    setOpen(false)
    setSubmitting(false)
  }

  async function confirm() {
    if (!selected) return
    setSubmitting(true)
    try {
      await swapMatchTeams(matchId, selected.id, leagueSlug)
      toast.success("Rivales intercambiados")
      reset()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo intercambiar")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) setSelectedId(null)
      }}
    >
      <DialogTrigger
        className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
        title="Intercambiar rivales con otro partido de la jornada"
      >
        <ArrowLeftRight className="h-3.5 w-3.5" />
        Intercambiar
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Intercambiar rivales</DialogTitle>
          <DialogDescription>
            {localName} vs {visitorName} — elegí el partido de la jornada con el que querés
            intercambiar los rivales.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {candidates.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No hay otros partidos intercambiables en esta jornada.
            </p>
          ) : (
            candidates.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors",
                  selectedId === c.id
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border hover:bg-muted",
                )}
              >
                <span>
                  {c.localName} <span className="text-muted-foreground">vs</span> {c.visitorName}
                </span>
                {selectedId === c.id && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))
          )}
        </div>

        {selected && (
          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <p className="mb-1 font-medium">Resultado del intercambio:</p>
            <p>
              {localName} <span className="text-muted-foreground">vs</span>{" "}
              <strong>{selected.visitorName}</strong>
            </p>
            <p>
              {selected.localName} <span className="text-muted-foreground">vs</span>{" "}
              <strong>{visitorName}</strong>
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={confirm} disabled={!selected || submitting}>
            {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Intercambiar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}