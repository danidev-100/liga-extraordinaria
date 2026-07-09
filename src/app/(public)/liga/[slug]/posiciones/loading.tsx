import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonStandingsRow } from "@/components/ui/skeletons"

export default function PosicionesLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>
      <div className="overflow-hidden rounded-xl border">
        <SkeletonStandingsRow />
        <SkeletonStandingsRow />
        <SkeletonStandingsRow />
        <SkeletonStandingsRow />
        <SkeletonStandingsRow />
        <SkeletonStandingsRow />
      </div>
    </div>
  )
}
