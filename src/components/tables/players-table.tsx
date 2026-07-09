"use client"

import { useState } from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DeleteButton } from "@/components/forms/delete-button"
import { Edit, Filter } from "lucide-react"
import { deletePlayer } from "@/actions/player"
import { TeamLogo } from "@/components/ui/team-logo"

export type PlayerRow = {
  id: string
  name: string
  surname: string
  dni: string
  birthDate: string
  jerseyNumber: number | null
  isActive: boolean
  teamName: string
  teamShortName: string
  teamLogoUrl: string | null
  teamColor: string | null
  categoryName: string
  totalGoals: number
  totalCards: number
}

interface PlayersTableProps {
  players: PlayerRow[]
  teams?: { id: string; shortName: string; name: string }[]
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

const baseColumns: ColumnDef<PlayerRow>[] = [
  {
    accessorFn: (row) => `${row.name} ${row.surname}`,
    header: "Nombre",
    id: "name",
    cell: ({ row }) => (
      <Link
        href={`/players/${row.original.id}`}
        className="font-medium hover:underline transition-colors"
      >
        {row.original.name} {row.original.surname}
      </Link>
    ),
  },
  {
    accessorKey: "dni",
    header: "DNI",
  },
  {
    id: "birthDate",
    header: "Fecha Nac.",
    accessorFn: (row) => formatDate(row.birthDate),
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {formatDate(row.original.birthDate)}
      </span>
    ),
  },
  {
    accessorKey: "categoryName",
    header: "Categoría",
  },
  {
    accessorKey: "teamShortName",
    header: "Equipo",
    cell: ({ row }) => (
      <span className="flex items-center gap-2">
        <TeamLogo logoUrl={row.original.teamLogoUrl} color={row.original.teamColor} name={row.original.teamName} size="md" />
        {row.original.teamShortName}
      </span>
    ),
  },
  {
    id: "jerseyNumber",
    header: "Camiseta",
    accessorFn: (row) => (row.jerseyNumber ? `#${row.jerseyNumber}` : ""),
    cell: ({ row }) =>
      row.original.jerseyNumber ? (
        <Badge variant="outline">#{row.original.jerseyNumber}</Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: "isActive",
    header: "Estado",
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? "default" : "secondary"}>
        {row.original.isActive ? "Activo" : "Inactivo"}
      </Badge>
    ),
  },
  {
    accessorKey: "totalGoals",
    header: "Goles",
    meta: { align: "right" },
    cell: ({ row }) => (
      <span className="font-bold text-primary">
        {row.original.totalGoals}
      </span>
    ),
  },
  {
    accessorKey: "totalCards",
    header: "T",
    meta: { align: "right" },
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.totalCards}
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Link href={`/admin/players/${row.original.id}`}>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        </Link>
        <DeleteButton
          action={deletePlayer.bind(null, row.original.id)}
          confirmMessage="¿Eliminar este jugador?"
        />
      </div>
    ),
  },
]

export function PlayersTable({ players, teams }: PlayersTableProps) {
  const [teamFilter, setTeamFilter] = useState("")

  const filteredPlayers = teamFilter && teamFilter !== "all"
    ? players.filter((p) => p.teamShortName === teamFilter)
    : players

  // Extract unique teams from data if not provided
  const teamOptions = teams ?? Array.from(new Set(players.map((p) => ({
    id: p.teamShortName,
    shortName: p.teamShortName,
    name: p.teamName,
  })))).sort((a, b) => a.shortName.localeCompare(b.shortName, "es"))

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        {/* Team filter */}
        {teamOptions.length > 0 && (
          <div className="w-full sm:w-56">
            <Select value={teamFilter} onValueChange={(v: string | null) => setTeamFilter(v ?? "")}>
              <SelectTrigger>
                <Filter className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="Filtrar por equipo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  Todos los equipos
                </SelectItem>
                {teamOptions.map((t) => (
                  <SelectItem key={t.id} value={t.shortName}>
                    {t.shortName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <DataTable
        columns={baseColumns}
        data={filteredPlayers}
        searchKey="name"
        searchPlaceholder="Buscar por nombre..."
      />
    </div>
  )
}
