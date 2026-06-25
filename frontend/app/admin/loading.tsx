import { AppShell } from '@/src/components/layout/AppShell';
import { Skeleton } from '@/src/components/ui/Skeleton';

export default function Loading() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
