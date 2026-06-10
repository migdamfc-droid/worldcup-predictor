export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="glass-card p-4 animate-pulse">
      <div className="mb-3 h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="mb-2 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-200/60 dark:bg-zinc-800/60" />
      ))}
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="glass-card flex items-center gap-4 p-4 animate-pulse">
      <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
      <div className="flex-1">
        <div className="mb-2 h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-3 w-48 rounded bg-zinc-200 dark:bg-zinc-200/60 dark:bg-zinc-800/60" />
      </div>
      <div className="h-8 w-12 rounded bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}
