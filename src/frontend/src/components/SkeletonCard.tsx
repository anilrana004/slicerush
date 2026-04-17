export function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Image skeleton */}
      <div className="aspect-video skeleton" />
      {/* Body skeleton */}
      <div className="p-3 space-y-2">
        <div className="skeleton h-3 w-full rounded-md" />
        <div className="skeleton h-3 w-3/4 rounded-md" />
        <div className="skeleton h-3 w-1/2 rounded-md mt-2" />
      </div>
    </div>
  );
}
