import { AppShell } from '@/src/components/layout/AppShell';
import { Skeleton } from '@/src/components/ui/Skeleton';

export default function Loading() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-3 text-center">
          <Skeleton className="mx-auto h-10 w-1/2" />
          <Skeleton className="mx-auto h-5 w-1/3" />
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-96 rounded-3xl" />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
