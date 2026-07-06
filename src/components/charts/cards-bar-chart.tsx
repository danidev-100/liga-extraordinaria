"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { ShieldAlert } from "lucide-react"
import { ChartCard } from "@/components/charts/chart-card"
import { EmptyState } from "@/components/ui/empty-state"
import type { CardsBreakdown } from "@/lib/analytics"

interface CardsBarChartProps {
  data: CardsBreakdown[]
}

function CardsTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-sm">
        <p className="mb-1 font-medium">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.dataKey} className="text-muted-foreground">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function CardsBarChart({ data }: CardsBarChartProps) {
  if (data.length === 0) {
    return (
      <ChartCard title="Tarjetas por Equipo">
        <EmptyState icon={ShieldAlert} title="Sin tarjetas registradas" />
      </ChartCard>
    )
  }

  return (
    <ChartCard title="Tarjetas por Equipo">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barSize={32} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="teamShortName"
            tick={{ fontSize: 12 }}
            interval={0}
            angle={-25}
            textAnchor="end"
            height={60}
          />
          <YAxis allowDecimals={false} />
          <Tooltip content={<CardsTooltip />} />
          <Legend />
          <Bar
            dataKey="yellows"
            fill="#eab308"
            name="Amarillas"
            stackId="cards"
          />
          <Bar
            dataKey="reds"
            fill="#ef4444"
            name="Rojas"
            stackId="cards"
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
