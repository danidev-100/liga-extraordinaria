import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface ChartSkeletonProps {
  hasHeader?: boolean
  className?: string
}

/**
 * Skeleton placeholder matching ChartCard dimensions.
 * Used as Suspense fallback while chart components load.
 */
export function ChartSkeleton({ hasHeader = true, className }: ChartSkeletonProps) {
  return (
    <div className={cn("rounded-xl border bg-card p-6 shadow-xs h-[300px]", className)}>
      {hasHeader && (
        <div className="mb-6 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      )}
      <div className="flex h-[calc(100%-3rem)] items-center justify-center">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    </div>
  )
}
