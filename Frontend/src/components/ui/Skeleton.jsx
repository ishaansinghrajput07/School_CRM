// Generic shimmer building block - a soft gradient sweep over a placeholder
// block, used everywhere something is still loading instead of a blank
// screen or a single spinner. Animation is defined once in index.css.
export function Shimmer({ className = "", style }) {
  return <div className={`skeleton-shimmer rounded-md ${className}`} style={style} />;
}

export function NoticeCardSkeleton() {
  return (
    <div className="card overflow-hidden !p-0">
      <Shimmer className="h-1.5 w-full !rounded-none" />
      <div className="space-y-3 p-5">
        <Shimmer className="h-5 w-20" />
        <Shimmer className="h-4 w-3/4" />
        <Shimmer className="h-3 w-full" />
        <Shimmer className="h-3 w-5/6" />
        <Shimmer className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="card space-y-3">
      <Shimmer className="h-3 w-24" />
      <Shimmer className="h-7 w-16" />
      <Shimmer className="h-3 w-20" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 4 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-3.5">
          <Shimmer className="h-4 w-full max-w-[140px]" />
        </td>
      ))}
    </tr>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} cols={cols} />
      ))}
    </>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card space-y-3">
          <Shimmer className="h-4 w-32" />
          <Shimmer className="h-40 w-full" />
        </div>
        <div className="card space-y-3">
          <Shimmer className="h-4 w-32" />
          <Shimmer className="h-40 w-full" />
        </div>
      </div>
    </div>
  );
}

// Full-page loading screen shown while the app shell itself boots (first
// paint) - a branded shimmer instead of a bare spinner on a blank white page.
export function AppBootLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-500 to-violet-600 shadow-glow">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      </div>
      <div className="space-y-2 text-center">
        <p className="font-display text-sm font-semibold text-navy-700">St. Thomas Convent Hr. Sec. School</p>
        <div className="mx-auto flex gap-1.5">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-navy-400 [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-navy-400 [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-navy-400" />
        </div>
      </div>
    </div>
  );
}
