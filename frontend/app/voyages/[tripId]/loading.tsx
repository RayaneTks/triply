import { AppShell } from '@/src/components/layout/AppShell';
import { ActivitiesSkeleton, Skeleton } from '@/src/components/ui/Skeleton';

export default function Loading() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-5 w-1/4" />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <ActivitiesSkeleton count={4} />
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
