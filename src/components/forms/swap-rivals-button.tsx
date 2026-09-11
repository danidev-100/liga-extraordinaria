"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeftRight, Loader2, Check, AlertTriangle } from "lucide-react"
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
  /** Team ids, used to compute repeated-crossing warnings. */
  localTeamId: string
  visitorTeamId: string
}

/** An encounter that already exists somewhere in the category. */
export interface ExistingEncounter {
  round: number
  localTeamId: string
  visitorTeamId: string
}

interface SwapRivalsButtonProps {
  matchId: string
  localName: string
  visitorName: string
  /** Team ids of the match being edited. */
  localTeamId: string
  visitorTeamId: string
  candidates: SwapCandidate[]
  /** Existing encounters in the category (used to warn about repeats). */
  encounters: ExistingEncounter[]
  /** League slug when rendered from a scoped admin page. */
  leagueSlug?: string
}

interface Warning {
  round: number
  localName: string
  visitorName: string
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

export function SwapRivalsButton({
  matchId,
  localName,
  visitorName,
  localTeamId,
  visitorTeamId,
  candidates,
  encounters,
  leagueSlug,
}: SwapRivalsButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmedWarnings, setConfirmedWarnings] = useState(false)

  const selected = candidates.find((c) => c.id === selectedId) ?? null

  // Compute warnings for the currently selected candidate.
  const warnings = useMemo<Warning[]>(() => {
    if (!selected) return []
    const newPairs = [
      { local: localTeamId, visitor: selected.visitorTeamId ?? "" },
      { local: selected.localTeamId ?? "", visitor: visitorTeamId },
    ]
    const out: Warning[] = []
    for (const pair of newPairs) {
      if (!pair.local || !pair.visitor) continue
      const key = pairKey(pair.local, pair.visitor)
      const existing = encounters.find(
        (e) => pairKey(e.localTeamId, e.visitorTeamId) === key,
      )
      if (existing) {
        // Resolve names: we only have names for the two matches' teams.
        const nameOf = (id: string) => {
          if (id === localTeamId) return localName
          if (id === visitorTeamId) return visitorName
          if (id === selected.localTeamId) return selected.localName
          if (id === selected.visitorTeamId) return selected.visitorName
          return id
        }
        out.push({
          round: existing.round,
          localName: nameOf(pair.local),
          visitorName: nameOf(pair.visitor),
        })
      }
    }
    return out
  }, [selected, localTeamId, visitorTeamId, localName, visitorName, encounters])

  // Reset the "confirmed warnings" flag when the selection changes.
  function selectCandidate(id: string) {
    setSelectedId(id)
    setConfirmedWarnings(false)
  }

  function reset() {
    setSelectedId(null)
    setOpen(false)
    setSubmitting(false)
    setConfirmedWarnings(false)
  }

  async function confirm() {
    if (!selected) return
    if (warnings.length > 0 && !confirmedWarnings) {
      setConfirmedWarnings(true)
      return
    }
    setSubmitting(true)
    try {
      const result = await swapMatchTeams(matchId, selected.id, leagueSlug)
      if (result && result.warnings) {
        toast.warning(`Se aplicó el intercambio. Cruces repetidos: ${result.warnings}`)
      } else {
        toast.success("Rivales intercambiados")
      }
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
                onClick={() => selectCandidate(c.id)}
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

        {selected && warnings.length > 0 && (
          <div
            className={cn(
              "rounded-lg border p-3 text-sm",
              confirmedWarnings
                ? "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                : "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
            )}
          >
            <p className="mb-1 flex items-center gap-1.5 font-medium">
              <AlertTriangle className="h-4 w-4" />
              {confirmedWarnings ? "Confirmá que querés repetir estos cruces:" : "Este intercambio repetirá cruces:"}
            </p>
            <ul className="list-inside list-disc space-y-0.5">
              {warnings.map((w, i) => (
                <li key={i}>
                  {w.localName} vs {w.visitorName} — ya están en la Jornada {w.round}
                </li>
              ))}
            </ul>
            {!confirmedWarnings && (
              <p className="mt-1 text-xs opacity-80">
                Volvé a tocar &quot;Intercambiar&quot; para confirmar.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={confirm} disabled={!selected || submitting}>
            {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {warnings.length > 0 && !confirmedWarnings ? "Intercambiar" : "Intercambiar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}