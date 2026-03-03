import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div>
      {/* Discovery banner skeleton */}
      <div className="mb-12">
        <Skeleton className="h-[72px] w-full rounded-xl" />
      </div>

      {/* Hero metric skeleton */}
      <div>
        <Skeleton className="h-4 w-48" />
        <Skeleton className="mt-3 h-16 w-72 md:h-24 md:w-96" />
        <Skeleton className="mt-3 h-7 w-40 rounded-full" />
      </div>

      {/* Trend chart skeleton */}
      <div className="mt-12">
        <Skeleton className="h-[250px] w-full rounded-xl md:h-[400px]" />
      </div>

      {/* Top drivers skeleton */}
      <div className="mt-12">
        <Skeleton className="h-4 w-44" />
        <div className="mt-4 space-y-4">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
        </div>
      </div>
    </div>
  );
}
