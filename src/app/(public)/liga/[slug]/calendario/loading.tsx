import { SkeletonCalendarGrid } from "@/components/ui/skeletons"
import { Skeleton } from "@/components/ui/skeleton"

export default function CalendarioLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>
      <SkeletonCalendarGrid />
    </div>
  )
}
