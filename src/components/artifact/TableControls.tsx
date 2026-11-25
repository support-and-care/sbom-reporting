"use client";

import { Check, ChevronDown, Funnel, Search } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { menuContentStyles } from "@/components/artifact/VersionMenu";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

type TableSearchFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
};

/** Filters a table as you type; there is nothing to submit. */
export function TableSearchField({
  label,
  placeholder,
  value,
  onChange,
}: TableSearchFieldProps) {
  return (
    <label className="relative flex w-full items-center sm:w-90">
      <span className="sr-only">{label}</span>
      <Search
        aria-hidden
        className="pointer-events-none absolute left-4 size-5 text-neutral-700"
      />
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-[1.25rem] border border-neutral-600 bg-neutral-0 pr-4 pl-11 text-base text-neutral-900 outline-none placeholder:text-neutral-700 focus-visible:border-2 focus-visible:border-blue-700 focus-visible:pl-[calc(--spacing(11)-1px)]"
      />
    </label>
  );
}

/** Placeholder for a missing value in a table cell. */
export function NotAvailable() {
  return (
    <span className="text-neutral-500">
      <span aria-hidden>—</span>
      <span className="sr-only">Not available</span>
    </span>
  );
}

type FilterOption<T extends string> = {
  value: T;
  label: string;
  count: number;
};

type FilterMenuProps<T extends string> = {
  /** Names the filter for assistive technology, e.g. `Severity`. */
  name: string;
  /** Trigger text while nothing is selected. */
  placeholder: string;
  options: FilterOption<T>[];
  selected: T[];
  onChange: (selected: T[]) => void;
  /** Shows the funnel icon, as on wide triggers. */
  withIcon?: boolean;
  className?: string;
};

/**
 * Multi-select filter (design: filter/trigger opening a menu of checkboxes).
 * Highlighted in blue while a filter is applied.
 */
export function FilterMenu<T extends string>({
  name,
  placeholder,
  options,
  selected,
  onChange,
  withIcon = false,
  className,
}: FilterMenuProps<T>) {
  const isActive = selected.length > 0;
  const summary = isActive
    ? options
        .filter((option) => selected.includes(option.value))
        .map((option) => option.label)
        .join(", ")
    : placeholder;

  function toggle(value: T, checked: boolean) {
    onChange(
      checked
        ? options
            .map((option) => option.value)
            .filter((option) => option === value || selected.includes(option))
        : selected.filter((option) => option !== value),
    );
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={`${name}: ${summary}`}
        className={cn(
          "flex h-10 min-w-0 items-center gap-2 rounded-[0.875rem] border border-neutral-600 bg-neutral-0 px-3 text-sm leading-4 font-bold text-neutral-900 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:border-2 data-[state=open]:border-blue-700 data-[state=open]:px-[calc(--spacing(3)-1px)]",
          isActive && "border-blue-700 bg-blue-50 text-blue-700",
          className,
        )}
      >
        {withIcon && <Funnel aria-hidden className="size-5 shrink-0" />}
        <span className="min-w-0 flex-1 truncate text-left">{summary}</span>
        <ChevronDown aria-hidden className="size-5 shrink-0" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className={menuContentStyles}
        >
          {options.map((option) => (
            <DropdownMenu.CheckboxItem
              key={option.value}
              checked={selected.includes(option.value)}
              onCheckedChange={(checked) => toggle(option.value, checked)}
              // Keep the menu open so several options can be picked.
              onSelect={(event) => event.preventDefault()}
              className="group flex cursor-pointer items-center gap-3 px-4 py-2 text-caption text-neutral-800 outline-none select-none data-highlighted:bg-blue-50 data-[state=checked]:text-blue-700"
            >
              <span className="grid size-3.75 shrink-0 place-items-center rounded-xs border border-slate-300 bg-neutral-0 group-data-[state=checked]:border-[1.5px] group-data-[state=checked]:border-blue-700">
                <DropdownMenu.ItemIndicator>
                  <Check
                    aria-hidden
                    strokeWidth={3}
                    className="size-2.5 text-blue-700"
                  />
                </DropdownMenu.ItemIndicator>
              </span>
              <span className="flex-1">{option.label}</span>
              <span className="text-slate-500">
                {formatNumber(option.count)}
              </span>
            </DropdownMenu.CheckboxItem>
          ))}
          {isActive && (
            <>
              <DropdownMenu.Separator className="my-2 h-px bg-neutral-200" />
              <DropdownMenu.Item
                onSelect={() => onChange([])}
                className="flex cursor-pointer items-center px-4 py-2 text-caption font-bold text-blue-700 outline-none select-none data-highlighted:bg-blue-50"
              >
                Clear filter
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
