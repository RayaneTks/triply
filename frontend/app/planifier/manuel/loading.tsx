import { AppShell } from '@/src/components/layout/AppShell';
import { Skeleton } from '@/src/components/ui/Skeleton';

export default function Loading() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-2/3 rounded-xl" />
      </div>
    </AppShell>
  );
}
