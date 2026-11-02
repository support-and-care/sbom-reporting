import { Button } from "@/components/ui/button";
import { SearchField, type SearchFieldSize } from "@/components/ui/SearchField";
import { routes } from "@/config/site";
import { cn } from "@/lib/utils";

type ArtifactSearchFormProps = {
  defaultQuery?: string;
  size?: Extract<SearchFieldSize, "large" | "hero">;
  className?: string;
};

export function ArtifactSearchForm({
  defaultQuery,
  size = "large",
  className,
}: ArtifactSearchFormProps) {
  return (
    <form
      role="search"
      action={routes.search}
      className={cn(
        "flex w-full flex-col gap-6 sm:flex-row sm:items-center",
        className,
      )}
    >
      <SearchField
        label="Search an artifact"
        placeholder="search an artifact, e.g. maven-core..."
        defaultValue={defaultQuery}
        size={size}
        className="flex-1"
      />
      <Button
        type="submit"
        className="h-17.5 rounded-pill px-2.5 text-2xl font-bold hover:bg-blue-800 sm:w-34"
      >
        Search
      </Button>
    </form>
  );
}
