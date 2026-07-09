import { SkeletonMatchGrid } from "@/components/ui/skeletons"
import { Skeleton } from "@/components/ui/skeleton"

export default function PartidosLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>
      </div>
      <SkeletonMatchGrid count={6} />
    </div>
  )
}
