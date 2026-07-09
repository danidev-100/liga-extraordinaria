import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonMatchCard() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-3 w-28" />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-1 flex-col items-center gap-2 text-center">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-8 w-12" />
          <div className="flex flex-1 flex-col items-center gap-2 text-center">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-center">
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonMatchGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonMatchCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonStandingsRow({ cols = 7 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-3 border-b px-4 py-3">
      <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
      <Skeleton className="h-4 w-8 shrink-0" />
      <Skeleton className="h-4 flex-1" />
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-8 shrink-0" />
      ))}
    </div>
  )
}

export function SkeletonScorersList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
          <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-8 shrink-0 rounded-md" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonCalendarGrid() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export function SkeletonCardsList({ count = 8 }: { count?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="flex gap-4 bg-muted/50 px-4 py-3">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-4 flex-1" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-12" />
        ))}
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-t px-4 py-3">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  )
}
