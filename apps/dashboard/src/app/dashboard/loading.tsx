import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-10">
      {/* Budget alert skeleton */}
      <Skeleton className="h-[72px] w-full rounded-xl" />

      {/* Hero metric skeleton */}
      <div>
        <Skeleton className="h-3.5 w-48" />
        <Skeleton className="mt-4 h-16 w-72 md:h-24 md:w-96" />
        <Skeleton className="mt-4 h-8 w-44 rounded-full" />
      </div>

      {/* Provider breakdown skeleton */}
      <Skeleton className="h-[200px] w-full rounded-2xl" />

      {/* Trend chart skeleton */}
      <div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
        <Skeleton className="mt-4 h-[280px] w-full rounded-2xl md:h-[360px]" />
      </div>

      {/* Top drivers skeleton */}
      <div>
        <Skeleton className="h-3.5 w-32" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
          ))}
        </div>
      </div>

      {/* Insights skeleton */}
      <div>
        <Skeleton className="h-3.5 w-28" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[88px] w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
