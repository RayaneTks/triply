import { Skeleton } from '@/src/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 space-y-6">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-64 w-full rounded-3xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
}
