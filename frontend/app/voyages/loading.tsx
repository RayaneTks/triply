import { AppShell } from '@/src/components/layout/AppShell';
import { TripListSkeleton } from '@/src/components/ui/Skeleton';

export default function Loading() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <TripListSkeleton count={3} />
      </div>
    </AppShell>
  );
}
