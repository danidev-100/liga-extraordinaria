"use client"

import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useState } from "react"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Loader2, Plus, X, AlertTriangle, CheckCircle } from "lucide-react"
import {
  finishMatchSchema,
  type FinishMatchFormData,
} from "@/lib/validations/match-result"
import { finishMatch } from "@/actions/match-result"

interface PlayerOption {
  id: string
  name: string
  surname: string
}

interface TeamOption {
  id: string
  name: string
  shortName: string
  players: PlayerOption[]
}

interface MatchResultFormProps {
  match: {
    id: string
    localTeam: TeamOption
    visitorTeam: TeamOption
  }
}

export function MatchResultForm({ match }: MatchResultFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const form = useForm<FinishMatchFormData>({
    resolver: zodResolver(finishMatchSchema),
    defaultValues: {
      localScore: 0,
      visitorScore: 0,
      goals: [],
      cards: [],
    },
  })

  const {
    fields: goalFields,
    append: appendGoal,
    remove: removeGoal,
  } = useFieldArray({ control: form.control, name: "goals" })

  const {
    fields: cardFields,
    append: appendCard,
    remove: removeCard,
  } = useFieldArray({ control: form.control, name: "cards" })

  const goals = form.watch("goals") ?? []
  const localGoals = goals.filter(
    (g) =>
      g.teamId &&
      ((g.teamId === match.localTeam.id && !g.isOwnGoal) ||
        (g.teamId === match.visitorTeam.id && g.isOwnGoal)),
  ).length
  const visitorGoals = goals.filter(
    (g) =>
      g.teamId &&
      ((g.teamId === match.visitorTeam.id && !g.isOwnGoal) ||
        (g.teamId === match.localTeam.id && g.isOwnGoal)),
  ).length

  async function onSubmit(data: FinishMatchFormData) {
    setIsSubmitting(true)
    try {
      const scoredGoals = data.goals ?? []
      const computedLocal = scoredGoals.filter(
        (g) =>
          g.teamId &&
          ((g.teamId === match.localTeam.id && !g.isOwnGoal) ||
            (g.teamId === match.visitorTeam.id && g.isOwnGoal)),
      ).length
      const computedVisitor = scoredGoals.filter(
        (g) =>
          g.teamId &&
          ((g.teamId === match.visitorTeam.id && !g.isOwnGoal) ||
            (g.teamId === match.localTeam.id && g.isOwnGoal)),
      ).length
      await finishMatch(match.id, {
        ...data,
        localScore: computedLocal,
        visitorScore: computedVisitor,
      })
      setShowConfirm(false)
      toast.success("Resultado del partido guardado exitosamente")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar el resultado")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Scores */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="localScore"
            render={() => (
              <FormItem>
                <FormLabel>{match.localTeam.shortName} (Local)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    readOnly
                    tabIndex={-1}
                    value={localGoals}
                    className="bg-muted/50"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="visitorScore"
            render={() => (
              <FormItem>
                <FormLabel>{match.visitorTeam.shortName} (Visitante)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    readOnly
                    tabIndex={-1}
                    value={visitorGoals}
                    className="bg-muted/50"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Goals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Goles</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendGoal({ playerId: "", teamId: "", minute: 1, isOwnGoal: false })
              }
            >
              <Plus className="mr-1 h-4 w-4" />
              Agregar Gol
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {goalFields.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No hay goles registrados. Agregá goles usando el botón de arriba.
              </p>
            )}
            {goalFields.map((field, index) => {
              const goalTeamId = (form.watch(`goals.${index}.teamId`) as string) ?? ""
              const playersForGoal =
                goalTeamId === match.localTeam.id
                  ? match.localTeam.players
                  : goalTeamId === match.visitorTeam.id
                    ? match.visitorTeam.players
                    : []
              return (
              <div key={field.id} className="flex items-start gap-2 rounded-lg border p-3">
                <div className="grid flex-1 gap-3 sm:grid-cols-4">
                  <FormField
                    control={form.control}
                    name={`goals.${index}.teamId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Equipo</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value)
                              form.setValue(`goals.${index}.playerId`, "")
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Equipo">
                                {(value: string | null) => {
                                  if (!value) return "Equipo"
                                  if (value === match.localTeam.id) return match.localTeam.shortName
                                  if (value === match.visitorTeam.id) return match.visitorTeam.shortName
                                  return null
                                }}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={match.localTeam.id}>
                                {match.localTeam.shortName}
                              </SelectItem>
                              <SelectItem value={match.visitorTeam.id}>
                                {match.visitorTeam.shortName}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`goals.${index}.playerId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Jugador</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Jugador">
                                {(value: string | null) => {
                                  if (!value) return "Jugador"
                                  const p = playersForGoal.find((pl) => pl.id === value)
                                  return p ? `${p.name} ${p.surname}` : null
                                }}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {playersForGoal.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name} {p.surname}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`goals.${index}.minute`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Minuto</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={120}
                            placeholder="1"
                            value={field.value as number | string}
                            onChange={(e) =>
                              field.onChange(e.target.value === "" ? "" : Number(e.target.value))
                            }
                            onBlur={field.onBlur}
                            ref={field.ref as React.Ref<HTMLInputElement>}
                            name={field.name}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`goals.${index}.isOwnGoal`}
                    render={({ field }) => (
                      <FormItem className="flex items-end pb-2">
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              id={`goal-own-${index}`}
                            />
                            <label
                              htmlFor={`goal-own-${index}`}
                              className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              En contra
                            </label>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-6"
                  onClick={() => removeGoal(index)}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Tarjetas</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendCard({ playerId: "", teamId: "", type: "YELLOW", minute: 1 })
              }
            >
              <Plus className="mr-1 h-4 w-4" />
              Agregar Tarjeta
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {cardFields.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No hay tarjetas registradas. Agregá tarjetas usando el botón de arriba.
              </p>
            )}
            {cardFields.map((field, index) => {
              const cardTeamId = (form.watch(`cards.${index}.teamId`) as string) ?? ""
              const playersForCard =
                cardTeamId === match.localTeam.id
                  ? match.localTeam.players
                  : cardTeamId === match.visitorTeam.id
                    ? match.visitorTeam.players
                    : []
              return (
              <div key={field.id} className="flex items-start gap-2 rounded-lg border p-3">
                <div className="grid flex-1 gap-3 sm:grid-cols-4">
                  <FormField
                    control={form.control}
                    name={`cards.${index}.teamId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Equipo</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value)
                              form.setValue(`cards.${index}.playerId`, "")
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Equipo">
                                {(value: string | null) => {
                                  if (!value) return "Equipo"
                                  if (value === match.localTeam.id) return match.localTeam.shortName
                                  if (value === match.visitorTeam.id) return match.visitorTeam.shortName
                                  return null
                                }}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={match.localTeam.id}>
                                {match.localTeam.shortName}
                              </SelectItem>
                              <SelectItem value={match.visitorTeam.id}>
                                {match.visitorTeam.shortName}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`cards.${index}.playerId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Jugador</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Jugador">
                                {(value: string | null) => {
                                  if (!value) return "Jugador"
                                  const p = playersForCard.find((pl) => pl.id === value)
                                  return p ? `${p.name} ${p.surname}` : null
                                }}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {playersForCard.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name} {p.surname}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`cards.${index}.type`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Tipo</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Tipo">
                                {(value: string | null) => {
                                  if (!value) return "Tipo"
                                  if (value === "YELLOW") return "Amarilla"
                                  if (value === "RED") return "Roja"
                                  return null
                                }}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="YELLOW">Amarilla</SelectItem>
                              <SelectItem value="RED">Roja</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`cards.${index}.minute`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Minuto</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={120}
                            placeholder="1"
                            value={field.value as number | string}
                            onChange={(e) =>
                              field.onChange(e.target.value === "" ? "" : Number(e.target.value))
                            }
                            onBlur={field.onBlur}
                            ref={field.ref as React.Ref<HTMLInputElement>}
                            name={field.name}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-6"
                  onClick={() => removeCard(index)}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
              )
            })}
          </CardContent>
        </Card>

        {showConfirm ? (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <AlertTriangle className="h-4 w-4" />
              ¿Confirmar resultado?
            </div>
            <div className="flex items-center justify-center gap-4 text-lg font-bold">
              <span>{match.localTeam.shortName}</span>
              <span className="text-primary">{localGoals} - {visitorGoals}</span>
              <span>{match.visitorTeam.shortName}</span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {goalFields.length} gol{goalFields.length !== 1 ? "es" : ""} · {cardFields.length} tarjeta{cardFields.length !== 1 ? "s" : ""}
            </p>
            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Confirmar
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowConfirm(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            className="w-full gap-2"
            onClick={() => setShowConfirm(true)}
          >
            <CheckCircle className="h-4 w-4" />
            Finalizar Partido
          </Button>
        )}
      </form>
    </Form>
  )
}
