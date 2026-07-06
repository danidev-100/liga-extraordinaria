"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DeleteButton } from "@/components/forms/delete-button"
import { Edit } from "lucide-react"
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
}

interface PlayersTableProps {
  players: PlayerRow[]
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

const columns: ColumnDef<PlayerRow>[] = [
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

export function PlayersTable({ players }: PlayersTableProps) {
  return (
    <DataTable
      columns={columns}
      data={players}
      searchKey="name"
      searchPlaceholder="Buscar por nombre..."
    />
  )
}
