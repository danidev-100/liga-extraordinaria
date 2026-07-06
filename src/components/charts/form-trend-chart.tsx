"use client"

import { useState, useCallback } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { TrendingDown } from "lucide-react"
import { ChartCard } from "@/components/charts/chart-card"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getFormTrendAction } from "@/actions/analytics"
import type { FormTrendRow } from "@/lib/analytics"

interface FormTrendChartProps {
  data: FormTrendRow[]
  categories: { id: string; name: string }[]
}

function FormTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-sm">
        <p className="mb-1 font-medium">Jornada {label}</p>
        {payload.map((entry: any) => (
          <p
            key={entry.dataKey}
            className="text-muted-foreground"
            style={{ color: entry.color }}
          >
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function FormTrendChart({ data: initialData, categories }: FormTrendChartProps) {
  const [data, setData] = useState<FormTrendRow[]>(initialData)
  const [loading, setLoading] = useState(false)

  const handleCategoryChange = useCallback(
    async (categoryId: string) => {
      setLoading(true)
      try {
        const result = await getFormTrendAction(categoryId || null)
        setData(result)
      } catch {
        setData([])
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const categorySelect = (
    <Select
      onValueChange={(value) => handleCategoryChange(value as string)}
      disabled={loading}
    >
      <SelectTrigger className="h-8 w-44 text-xs">
        <SelectValue placeholder="Todas las categorías" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">Todas las categorías</SelectItem>
        {categories.map((cat) => (
          <SelectItem key={cat.id} value={cat.id}>
            {cat.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  if (data.length === 0 && !loading) {
    return (
      <ChartCard title="Tendencia de Forma" headerExtra={categorySelect}>
        <EmptyState
          icon={TrendingDown}
          title="Sin datos de forma reciente"
        />
      </ChartCard>
    )
  }

  return (
    <ChartCard title="Tendencia de Forma" headerExtra={categorySelect}>
      {loading ? (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Cargando...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ left: 0, right: 0, top: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="round"
              label={{
                value: "Jornada",
                position: "insideBottomRight",
                offset: -5,
              }}
            />
            <YAxis allowDecimals={false} />
            <Tooltip content={<FormTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="wins"
              stroke="#22c55e"
              name="Victorias"
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="draws"
              stroke="#eab308"
              name="Empates"
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="losses"
              stroke="#ef4444"
              name="Derrotas"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
