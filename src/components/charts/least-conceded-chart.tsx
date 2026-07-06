import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { Shield } from "lucide-react"
import { ChartCard } from "@/components/charts/chart-card"
import { EmptyState } from "@/components/ui/empty-state"
import type { GoalsDistribution } from "@/lib/analytics"

interface LeastConcededChartProps {
  data: GoalsDistribution[]
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-sm">
        <p className="font-medium">{label}</p>
        <p className="text-muted-foreground">
          Goles recibidos:{" "}
          <span className="font-bold text-primary">{payload[0].value}</span>
        </p>
      </div>
    )
  }
  return null
}

export function LeastConcededChart({ data }: LeastConcededChartProps) {
  if (data.length === 0) {
    return (
      <ChartCard title="Valla Menos Vencida">
        <EmptyState icon={Shield} title="Sin datos" description="No hay partidos finalizados aún." />
      </ChartCard>
    )
  }

  const chartData = [...data].sort((a, b) => a.goals - b.goals).slice(0, 5)

  return (
    <ChartCard title="Valla Menos Vencida" description="Equipos con menos goles recibidos">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ left: 0, right: 0, top: 8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="teamShortName"
            width={70}
            tick={{ fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="goals"
            fill="#16a34a"
            radius={[0, 4, 4, 0]}
            label={{ position: "right", fontSize: 12, fontWeight: 600 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
