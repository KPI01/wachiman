import { Skeleton } from "~/components/ui/skeleton";

export default function PageLoadingSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Cargando contenido">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex h-12 items-center gap-4 border-b px-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="flex h-14 items-center gap-4 border-b px-4 last:border-0">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
      <span className="sr-only">Cargando contenido…</span>
    </div>
  );
}
