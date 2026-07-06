"use client"

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Crosshair } from "lucide-react"
import { ChartCard } from "@/components/charts/chart-card"
import { EmptyState } from "@/components/ui/empty-state"
import type { GoalsDistribution } from "@/lib/analytics"

interface GoalsPieChartProps {
  data: GoalsDistribution[]
}

function GoalsTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const entry = payload[0]
    return (
      <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-sm">
        <p className="font-medium">{entry.name}</p>
        <p className="text-muted-foreground">{entry.value} goles</p>
      </div>
    )
  }
  return null
}

export function GoalsPieChart({ data }: GoalsPieChartProps) {
  if (data.length === 0) {
    return (
      <ChartCard title="Goles por Equipo">
        <EmptyState icon={Crosshair} title="Sin goles registrados" />
      </ChartCard>
    )
  }

  return (
    <ChartCard title="Goles por Equipo">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="goals"
            nameKey="teamShortName"
            cx="50%"
            cy="50%"
            outerRadius={100}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.teamColor ?? "#6366f1"} />
            ))}
          </Pie>
          <Tooltip content={<GoalsTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
