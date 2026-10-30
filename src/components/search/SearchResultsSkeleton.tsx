export function SearchResultsSkeleton() {
  return (
    <div aria-busy className="flex flex-col gap-4">
      <span className="sr-only">Loading search results</span>
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="h-22 animate-pulse rounded-card bg-neutral-50"
        />
      ))}
    </div>
  );
}
