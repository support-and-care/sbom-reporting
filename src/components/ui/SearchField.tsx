import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MAX_QUERY_LENGTH } from "@/lib/search-params";
import { cn } from "@/lib/utils";

type SearchFieldSize = "compact" | "large";

type SearchFieldProps = {
  label: string;
  placeholder: string;
  defaultValue?: string;
  size?: SearchFieldSize;
  className?: string;
};

const inputStyles: Record<SearchFieldSize, string> = {
  compact:
    "h-14 border-neutral-300 text-xl placeholder:text-neutral-500 md:text-xl",
  large:
    "h-16.5 border-blue-200 bg-neutral-0 text-base placeholder:text-neutral-400 md:text-base",
};

export function SearchField({
  label,
  placeholder,
  defaultValue,
  size = "large",
  className,
}: SearchFieldProps) {
  return (
    <label className={cn("relative flex items-center", className)}>
      <span className="sr-only">{label}</span>
      <Search className="pointer-events-none absolute left-5 size-6 text-neutral-500" />
      <Input
        type="search"
        name="q"
        placeholder={placeholder}
        defaultValue={defaultValue}
        maxLength={MAX_QUERY_LENGTH}
        className={cn(
          "rounded-pill pr-5 pl-14.5 shadow-none",
          inputStyles[size],
        )}
      />
    </label>
  );
}
