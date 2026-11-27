"use client";

import { Check, ChevronDown, Funnel, Search, SearchCode } from "lucide-react";
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

/** Header and cells of the source code columns, which hold a centred icon. */
export const sourceCodeColumnStyles = "text-center!";

/** Link to a component's source repository, as an icon. */
export function SourceCodeLink({
  url,
  componentName,
}: {
  url: string | undefined;
  componentName: string;
}) {
  if (!url) return <NotAvailable />;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      aria-label={`Source code of ${componentName} (opens in a new tab)`}
      className="inline-flex text-neutral-900 hover:text-blue-700"
    >
      <SearchCode aria-hidden className="size-6" />
    </a>
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
  description?: string;
  count: number;
};

const checkboxItemStyles =
  "group flex cursor-pointer items-center gap-3 px-4 py-2 text-neutral-900 outline-none select-none data-disabled:cursor-default data-disabled:opacity-50 data-highlighted:bg-blue-50";

function OptionText({
  label,
  description,
}: {
  label: string;
  description?: string;
}) {
  return (
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="text-caption font-bold group-data-[state=checked]:text-blue-700">
        {label}
      </span>
      {description && (
        <span className="text-xs text-slate-500">{description}</span>
      )}
    </span>
  );
}

function Checkbox() {
  return (
    <span className="grid size-4 shrink-0 place-items-center rounded-xs border border-slate-300 bg-neutral-0 group-data-[state=checked]:border-blue-700 group-data-[state=checked]:bg-blue-700">
      <DropdownMenu.ItemIndicator>
        <Check aria-hidden strokeWidth={3} className="size-3 text-neutral-0" />
      </DropdownMenu.ItemIndicator>
    </span>
  );
}

type FilterMenuProps<T extends string> = {
  /** Names the filter for assistive technology, e.g. `Severity`. */
  name: string;
  /** First option, checked while no filter is applied; picking it clears the filter. */
  all: { label: string; description: string };
  options: FilterOption<T>[];
  selected: T[];
  onChange: (selected: T[]) => void;
  /** Trigger text while nothing is selected; the `all` label by default. */
  placeholder?: string;
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
  all,
  options,
  selected,
  onChange,
  placeholder = all.label,
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
          <DropdownMenu.CheckboxItem
            checked={!isActive}
            onCheckedChange={() => onChange([])}
            onSelect={(event) => event.preventDefault()}
            className={checkboxItemStyles}
          >
            <Checkbox />
            <OptionText label={all.label} description={all.description} />
          </DropdownMenu.CheckboxItem>
          {options.map((option) => (
            <DropdownMenu.CheckboxItem
              key={option.value}
              checked={selected.includes(option.value)}
              disabled={option.count === 0 && !selected.includes(option.value)}
              onCheckedChange={(checked) => toggle(option.value, checked)}
              // Keep the menu open so several options can be picked.
              onSelect={(event) => event.preventDefault()}
              className={checkboxItemStyles}
            >
              <Checkbox />
              <OptionText
                label={option.label}
                description={option.description}
              />
              <span className="text-caption text-slate-500">
                {formatNumber(option.count)}
              </span>
            </DropdownMenu.CheckboxItem>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
