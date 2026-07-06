"use client"

import { Crosshair, Trophy } from "lucide-react"
import { ChartCard } from "@/components/charts/chart-card"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { TopScorerRow } from "@/lib/analytics"

interface TopScorersProps {
  data: TopScorerRow[]
}

const MEDAL_STYLES = ["text-amber-400", "text-gray-400", "text-amber-700"]

export function TopScorers({ data }: TopScorersProps) {
  if (data.length === 0) {
    return (
      <ChartCard title="Máximos Goleadores">
        <EmptyState icon={Crosshair} title="Sin goleadores aún" />
      </ChartCard>
    )
  }

  return (
    <ChartCard title="Máximos Goleadores">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8 text-center">#</TableHead>
            <TableHead>Jugador</TableHead>
            <TableHead>Equipo</TableHead>
            <TableHead className="w-10 text-right">G</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((scorer, i) => (
            <TableRow key={`${scorer.playerName}-${scorer.teamShortName}`}>
              <TableCell className="text-center">
                {i === 0 ? (
                  <Trophy className={cn("mx-auto h-4 w-4", MEDAL_STYLES[i])} />
                ) : (
                  <span
                    className={cn(
                      "text-sm font-bold",
                      MEDAL_STYLES[i] ?? "text-muted-foreground",
                    )}
                  >
                    {i + 1}
                  </span>
                )}
              </TableCell>
              <TableCell className="font-medium">
                {scorer.playerName}
                {i === 0 && (
                  <span className="ml-1 text-xs text-amber-400">★</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {scorer.teamShortName}
              </TableCell>
              <TableCell className="text-right font-bold tabular-nums">
                {scorer.goals}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ChartCard>
  )
}
