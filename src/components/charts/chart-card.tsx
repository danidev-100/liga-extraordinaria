import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ChartCardProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  headerExtra?: React.ReactNode
}

/**
 * Shared Card wrapper for all dashboard chart components.
 * Provides a consistent container with title, optional description,
 * optional header extra slot (for filters/dropdowns), and a fixed-height
 * content area for the chart.
 */
export function ChartCard({
  title,
  description,
  children,
  className,
  headerExtra,
}: ChartCardProps) {
  return (
    <Card className={cn("shadow-xs", className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {headerExtra && <div className="shrink-0">{headerExtra}</div>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">{children}</div>
      </CardContent>
    </Card>
  )
}
