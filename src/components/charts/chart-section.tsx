"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { ChartSkeleton, ChartErrorFallback } from "@/components/charts"
import type {
  GoalsDistribution,
  MatchStatusRow,
  CardsBreakdown,
  FormTrendRow,
  TopScorerRow,
} from "@/lib/analytics"

const GoalsPieChart = dynamic(
  () =>
    import("@/components/charts/goals-pie-chart").then((m) => m.GoalsPieChart),
  { ssr: false },
)
const MatchStatusChart = dynamic(
  () =>
    import("@/components/charts/match-status-chart").then(
      (m) => m.MatchStatusChart,
    ),
  { ssr: false },
)
const CardsBarChart = dynamic(
  () =>
    import("@/components/charts/cards-bar-chart").then((m) => m.CardsBarChart),
  { ssr: false },
)
const FormTrendChart = dynamic(
  () =>
    import("@/components/charts/form-trend-chart").then((m) => m.FormTrendChart),
  { ssr: false },
)
const TopScorers = dynamic(
  () => import("@/components/charts/top-scorers").then((m) => m.TopScorers),
  { ssr: false },
)

interface ChartSectionProps {
  goalsData: GoalsDistribution[]
  statusData: MatchStatusRow[]
  cardsData: CardsBreakdown[]
  formTrendData: FormTrendRow[]
  topScorersData: TopScorerRow[]
  categories: { id: string; name: string }[]
}

/**
 * Client-side wrapper that handles all dynamic imports with ssr: false
 * for recharts components. The admin page (server component) passes
 * pre-fetched data as props.
 *
 * Each chart is individually wrapped in Suspense + ErrorBoundary for
 * independent streaming and error isolation.
 */
export function ChartSection({
  goalsData,
  statusData,
  cardsData,
  formTrendData,
  topScorersData,
  categories,
}: ChartSectionProps) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="grid gap-6 sm:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <ErrorBoundary
            fallback={<ChartErrorFallback title="Goles por Equipo" />}
          >
            <GoalsPieChart data={goalsData} />
          </ErrorBoundary>
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <ErrorBoundary
            fallback={<ChartErrorFallback title="Estado de Partidos" />}
          >
            <MatchStatusChart data={statusData} />
          </ErrorBoundary>
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <ErrorBoundary
            fallback={<ChartErrorFallback title="Tarjetas por Equipo" />}
          >
            <CardsBarChart data={cardsData} />
          </ErrorBoundary>
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <ErrorBoundary
            fallback={<ChartErrorFallback title="Tendencia de Forma" />}
          >
            <FormTrendChart
              data={formTrendData}
              categories={categories}
            />
          </ErrorBoundary>
        </Suspense>
      </div>
      <Suspense fallback={<ChartSkeleton />}>
        <ErrorBoundary
          fallback={<ChartErrorFallback title="Máximos Goleadores" />}
        >
          <TopScorers data={topScorersData} />
        </ErrorBoundary>
      </Suspense>
    </section>
  )
}
