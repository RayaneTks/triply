import { AppShell } from '@/src/components/layout/AppShell';
import { Skeleton } from '@/src/components/ui/Skeleton';

export default function Loading() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 space-y-6 text-center">
        <Skeleton className="mx-auto h-9 w-3/4" />
        <Skeleton className="mx-auto h-5 w-1/2" />
        <Skeleton className="h-40 w-full rounded-3xl" />
      </div>
    </AppShell>
  );
}
