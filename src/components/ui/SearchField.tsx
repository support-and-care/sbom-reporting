"use client";

import { Search } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { useArtifactSuggestions } from "@/hooks/useArtifactSuggestions";
import { MAX_QUERY_LENGTH } from "@/lib/search-params";
import type { ArtifactSuggestion } from "@/lib/suggestions";
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

const listboxStyles: Record<SearchFieldSize, string> = {
  compact: "right-0 w-80",
  large: "left-0 w-full",
};

/**
 * Search input with artifact suggestions (WAI-ARIA combobox pattern).
 * Picking a suggestion submits the surrounding form with that artifact name.
 */
export function SearchField({
  label,
  placeholder,
  defaultValue = "",
  size = "large",
  className,
}: SearchFieldProps) {
  const [value, setValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const { isActive, suggestions, isLoading } = useArtifactSuggestions(
    value,
    isOpen,
  );

  const showListbox = isActive && (suggestions.length > 0 || !isLoading);
  const highlighted = activeIndex < suggestions.length ? activeIndex : -1;
  const optionId = (index: number) => `${listboxId}-option-${index}`;

  function close() {
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function select(suggestion: ArtifactSuggestion) {
    const input = inputRef.current;
    setValue(suggestion.name);
    close();
    if (!input) return;
    // Update the DOM value right away so the submitted form carries it.
    input.value = suggestion.name;
    input.form?.requestSubmit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!showListbox) {
      if (event.key === "ArrowDown") setIsOpen(true);
      return;
    }
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex(Math.min(highlighted + 1, suggestions.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex(Math.max(highlighted - 1, -1));
        break;
      case "Enter":
        if (highlighted >= 0) {
          event.preventDefault();
          select(suggestions[highlighted]);
        }
        break;
      case "Escape":
        close();
        break;
    }
  }

  return (
    <div className={cn("relative", className)}>
      <label className="relative flex items-center">
        <span className="sr-only">{label}</span>
        <Search className="pointer-events-none absolute left-5 size-6 text-neutral-500" />
        <Input
          ref={inputRef}
          type="search"
          name="q"
          role="combobox"
          aria-expanded={showListbox}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            highlighted >= 0 ? optionId(highlighted) : undefined
          }
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          maxLength={MAX_QUERY_LENGTH}
          onChange={(event) => {
            setValue(event.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={close}
          onKeyDown={handleKeyDown}
          className={cn(
            "rounded-pill pr-5 pl-14.5 shadow-none",
            inputStyles[size],
          )}
        />
      </label>

      {showListbox && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={`${label} suggestions`}
          className={cn(
            "absolute top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-card border border-neutral-200 bg-popover py-2 text-left text-popover-foreground shadow-lg",
            listboxStyles[size],
          )}
        >
          {suggestions.length === 0 ? (
            <li
              role="option"
              aria-selected={false}
              aria-disabled
              className="px-5 py-2 text-base text-neutral-600"
            >
              No matching artifacts
            </li>
          ) : (
            suggestions.map((suggestion, index) => (
              <li
                key={`${suggestion.group ?? ""}:${suggestion.name}`}
                id={optionId(index)}
                role="option"
                aria-selected={index === highlighted}
                // Keep focus in the input so the click isn't lost to onBlur.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => select(suggestion)}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex cursor-pointer flex-col gap-0.5 px-5 py-2",
                  index === highlighted && "bg-accent text-accent-foreground",
                )}
              >
                <span className="text-base font-semibold break-all">
                  {suggestion.group && (
                    <span className="text-neutral-600">
                      {suggestion.group} :{" "}
                    </span>
                  )}
                  {suggestion.name}
                </span>
                <span className="text-sm text-neutral-600">
                  Latest {suggestion.latestVersion}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
