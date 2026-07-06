"use client"

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Label,
} from "recharts"
import { Calendar } from "lucide-react"
import { ChartCard } from "@/components/charts/chart-card"
import { EmptyState } from "@/components/ui/empty-state"
import type { MatchStatusRow } from "@/lib/analytics"

interface MatchStatusChartProps {
  data: MatchStatusRow[]
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "#3b82f6",
  PLAYING: "#22c55e",
  FINISHED: "#6b7280",
}

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Programado",
  PLAYING: "Jugando",
  FINISHED: "Finalizado",
}

function StatusTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const entry = payload[0]
    const label = STATUS_LABELS[entry.name] ?? entry.name
    return (
      <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-sm">
        <p className="font-medium">{label}</p>
        <p className="text-muted-foreground">{entry.value} partidos</p>
      </div>
    )
  }
  return null
}

export function MatchStatusChart({ data }: MatchStatusChartProps) {
  if (data.length === 0) {
    return (
      <ChartCard title="Estado de Partidos">
        <EmptyState icon={Calendar} title="Sin partidos registrados" />
      </ChartCard>
    )
  }

  const total = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <ChartCard title="Estado de Partidos">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={STATUS_COLORS[entry.status] ?? "#6b7280"}
              />
            ))}
            <Label
              value={total}
              position="center"
              className="text-2xl font-bold font-heading"
            />
          </Pie>
          <Tooltip content={<StatusTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
