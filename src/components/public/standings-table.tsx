"use client"

import Link from "next/link"
import { Trophy } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface StandingEntry {
  id: string
  position: number
  pts: number
  pj: number
  pg: number
  pe: number
  pp: number
  gf: number
  gc: number
  dg: number
  ta: number
  tr: number
  team: { id: string; name: string; shortName: string; color: string | null }
}

interface StandingsTableProps {
  standings: StandingEntry[]
  categoryName: string
}

const positionBadge = (pos: number) => {
  if (pos === 1)
    return "bg-yellow-400/20 text-yellow-600 dark:text-yellow-400 ring-yellow-400/40"
  if (pos === 2)
    return "bg-gray-300/30 text-gray-500 dark:text-gray-400 ring-gray-400/30"
  if (pos === 3)
    return "bg-amber-500/20 text-amber-600 dark:text-amber-400 ring-amber-500/30"
  return "bg-muted/50 text-muted-foreground ring-border/50"
}

export function StandingsTable({ standings, categoryName }: StandingsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Category header */}
      <div className="flex items-center gap-2 border-b px-6 py-4">
        <Trophy className="h-5 w-5 text-primary" />
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          {categoryName}
        </h2>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead>Equipo</TableHead>
              <TableHead className="w-12 text-center">Pts</TableHead>
              <TableHead className="w-10 text-center">PJ</TableHead>
              <TableHead className="w-10 text-center">PG</TableHead>
              <TableHead className="w-10 text-center">PE</TableHead>
              <TableHead className="w-10 text-center">PP</TableHead>
              <TableHead className="w-10 text-center">GF</TableHead>
              <TableHead className="w-10 text-center">GC</TableHead>
              <TableHead className="w-14 text-center">DG</TableHead>
              <TableHead className="hidden sm:table-cell w-10 text-center">TA</TableHead>
              <TableHead className="hidden sm:table-cell w-10 text-center">TR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {standings.map((row, index) => {
              const isTopThree = row.position <= 3

              return (
                <TableRow
                  key={row.id}
                  className={cn(
                    "transition-colors hover:bg-muted/40",
                    index % 2 === 1 && "bg-muted/15",
                    isTopThree &&
                      "bg-gradient-to-r from-primary/5 to-transparent dark:from-primary/10",
                    row.position === 1 && "font-medium",
                  )}
                >
                  <TableCell className="text-center">
                    <span
                      className={cn(
                        "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ring-1",
                        positionBadge(row.position),
                      )}
                    >
                      {row.position}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {row.team.color && (
                        <span
                          className="inline-block h-3 w-3 rounded-full ring-1 ring-black/10"
                          style={{ backgroundColor: row.team.color }}
                        />
                      )}
                      <Link
                        href={`/teams/${row.team.id}`}
                        className="font-medium transition-colors hover:text-primary hover:underline"
                      >
                        {row.team.shortName}
                      </Link>
                      <span className="hidden text-xs text-muted-foreground sm:inline">
                        {row.team.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-bold text-primary">
                    {row.pts}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {row.pj}
                  </TableCell>
                  <TableCell className="text-center text-green-600 dark:text-green-400">
                    {row.pg}
                  </TableCell>
                  <TableCell className="text-center text-amber-600 dark:text-amber-400">
                    {row.pe}
                  </TableCell>
                  <TableCell className="text-center text-red-500 dark:text-red-400">
                    {row.pp}
                  </TableCell>
                  <TableCell className="text-center">{row.gf}</TableCell>
                  <TableCell className="text-center">{row.gc}</TableCell>
                  <TableCell className="text-center">
                    <span
                      className={cn(
                        "font-medium tabular-nums",
                        row.dg > 0 && "text-green-600 dark:text-green-400",
                        row.dg < 0 && "text-red-500 dark:text-red-400",
                      )}
                    >
                      {row.dg > 0 ? "+" : ""}
                      {row.dg}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-center">
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-sm bg-yellow-400" />
                      {row.ta}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-center">
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-sm bg-red-500" />
                      {row.tr}
                    </span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
