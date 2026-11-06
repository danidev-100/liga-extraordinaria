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
import { useNarrowChart } from "@/components/charts/use-narrow-chart"
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
  const narrow = useNarrowChart()

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
        <BarChart
          data={data}
          barSize={narrow ? 14 : 32}
          margin={{ left: 0, right: 0, top: 8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="teamShortName"
            tick={{ fontSize: narrow ? 10 : 12 }}
            interval={narrow ? "preserveStartEnd" : 0}
            angle={-25}
            textAnchor="end"
            height={60}
          />
          <YAxis
            allowDecimals={false}
            width={narrow ? 32 : undefined}
            tick={narrow ? { fontSize: 10 } : undefined}
          />
          <Tooltip content={<CardsTooltip />} />
          <Legend wrapperStyle={narrow ? { fontSize: 10 } : undefined} />
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
