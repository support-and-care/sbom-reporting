import { ChevronDown } from "lucide-react";
import { SORT_OPTIONS, type SortOption } from "@/lib/project-artifacts";

type SortSelectProps = {
  value: SortOption;
  onChange: (value: SortOption) => void;
};

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <label className="relative flex items-center">
      <span className="sr-only">Sort artifacts</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as SortOption)}
        className="h-12 w-full cursor-pointer appearance-none rounded-[1.25rem] border border-neutral-300 bg-neutral-0 pr-14 pl-4 text-caption text-neutral-800 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            Sort by {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-6.5 size-6 text-neutral-900"
      />
    </label>
  );
}
