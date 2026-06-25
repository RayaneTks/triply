import { AppShell } from '@/src/components/layout/AppShell';
import { Skeleton } from '@/src/components/ui/Skeleton';

export default function Loading() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-72 w-full rounded-3xl" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    </AppShell>
  );
}
