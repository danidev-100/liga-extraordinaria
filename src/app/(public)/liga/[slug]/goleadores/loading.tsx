import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonScorersList } from "@/components/ui/skeletons"

export default function GoleadoresLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>
      <SkeletonScorersList count={10} />
    </div>
  )
}
