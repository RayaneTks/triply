import { Skeleton } from '@/src/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-10 space-y-5">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-11 w-full rounded-full" />
    </div>
  );
}
