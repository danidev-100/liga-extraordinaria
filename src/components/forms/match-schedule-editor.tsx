"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Save, ArrowUp, ArrowDown, RefreshCw } from "lucide-react"
import { bulkUpdateMatches, swapMatchRound } from "@/actions/match-order"

interface Match {
  id: string
  round: number
  date: Date
  time: string
  court: { id: string; name: string }
  localTeam: { id: string; name: string; shortName: string }
  visitorTeam: { id: string; name: string; shortName: string }
}

interface RoundGroup {
  round: number
  matches: Match[]
}

interface Props {
  rounds: RoundGroup[]
}

type EditMap = Record<string, { date: string; time: string; round: number }>

export function MatchScheduleEditor({ rounds }: Props) {
  const [edits, setEdits] = useState<EditMap>({})
  const [saving, setSaving] = useState<Set<string>>(new Set())
  const [bulkSaving, setBulkSaving] = useState(false)

  function initEdit(m: Match) {
    if (edits[m.id]) return
    setEdits((prev) => ({
      ...prev,
      [m.id]: {
        date: new Date(m.date).toISOString().split("T")[0],
        time: m.time,
        round: m.round,
      },
    }))
  }

  function updateEdit(id: string, field: string, value: string | number) {
    setEdits((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }))
  }

  function isDirty(m: Match): boolean {
    const e = edits[m.id]
    if (!e) return false
    const origDate = new Date(m.date).toISOString().split("T")[0]
    return e.date !== origDate || e.time !== m.time || e.round !== m.round
  }

  async function saveOne(matchId: string) {
    const e = edits[matchId]
    if (!e) return

    setSaving((prev) => new Set(prev).add(matchId))
    try {
      await bulkUpdateMatches([{ id: matchId, date: e.date, time: e.time, round: e.round }])
      toast.success("Partido actualizado")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar")
    } finally {
      setSaving((prev) => {
        const next = new Set(prev)
        next.delete(matchId)
        return next
      })
    }
  }

  async function saveAll() {
    const dirty = rounds.flatMap((r) =>
      r.matches.filter((m) => isDirty(m)).map((m) => ({
        id: m.id,
        date: edits[m.id].date,
        time: edits[m.id].time,
        round: edits[m.id].round,
      })),
    )
    if (dirty.length === 0) {
      toast.info("No hay cambios pendientes")
      return
    }

    setBulkSaving(true)
    try {
      const result = await bulkUpdateMatches(dirty)
      toast.success(`${result.ok} partidos actualizados${result.errors > 0 ? `, ${result.errors} errores` : ""}`)
      setEdits({})
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar")
    } finally {
      setBulkSaving(false)
    }
  }

  async function handleSwap(matchId1: string, matchId2: string) {
    try {
      await swapMatchRound(matchId1, matchId2)
      toast.success("Rondas intercambiadas")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al intercambiar")
    }
  }

  const hasEdits = rounds.some((r) => r.matches.some((m) => isDirty(m)))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Editá la fecha, hora o ronda de cada partido. Los cambios se validan contra disponibilidad de cancha.
        </p>
        <Button onClick={saveAll} disabled={!hasEdits || bulkSaving} size="sm">
          {bulkSaving ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Guardar todo
        </Button>
      </div>

      {rounds.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">No hay partidos en esta categoría.</p>
      ) : (
        rounds.map(({ round, matches: roundMatches }) => (
          <section key={round} className="space-y-2">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                {round}
              </span>
              Jornada {round}
              <span className="text-sm font-normal text-muted-foreground">
                {roundMatches.length} partidos
              </span>
            </h3>

            <div className="overflow-hidden rounded-xl border bg-card">
              <div className="divide-y">
                {roundMatches.map((match, idx) => {
                  const edit = edits[match.id]
                  const dirty = isDirty(match)
                  const savingThis = saving.has(match.id)

                  return (
                    <div
                      key={match.id}
                      className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${
                        dirty ? "bg-amber-50 dark:bg-amber-950/20" : ""
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="text-xs text-muted-foreground">{idx + 1}.</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            <span>{match.localTeam.shortName}</span>
                            <span className="mx-1.5 text-muted-foreground">vs</span>
                            <span>{match.visitorTeam.shortName}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">{match.court.name}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2" onClick={() => initEdit(match)}>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            type="date"
                            value={edit?.date ?? new Date(match.date).toISOString().split("T")[0]}
                            onChange={(e) => updateEdit(match.id, "date", e.target.value)}
                            className="h-8 w-36 text-xs"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            type="time"
                            value={edit?.time ?? match.time}
                            onChange={(e) => updateEdit(match.id, "time", e.target.value)}
                            className="h-8 w-24 text-xs"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">R</Badge>
                          <Input
                            type="number"
                            min={1}
                            value={edit?.round ?? match.round}
                            onChange={(e) => updateEdit(match.id, "round", Number(e.target.value))}
                            className="h-8 w-16 text-xs"
                          />
                        </div>

                        {dirty && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => saveOne(match.id)}
                            disabled={savingThis}
                            className="h-8 px-2"
                          >
                            {savingThis ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Save className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}

                        <div className="flex gap-0.5">
                          {idx > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleSwap(match.id, roundMatches[idx - 1].id)}
                              title="Intercambiar con el anterior"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {idx < roundMatches.length - 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleSwap(match.id, roundMatches[idx + 1].id)}
                              title="Intercambiar con el siguiente"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        ))
      )}
    </div>
  )
}
