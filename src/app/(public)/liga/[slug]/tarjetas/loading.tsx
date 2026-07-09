import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonCardsList } from "@/components/ui/skeletons"

export default function TarjetasLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>
      <SkeletonCardsList count={10} />
    </div>
  )
}
