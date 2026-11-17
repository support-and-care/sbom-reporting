"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { MAX_QUERY_LENGTH } from "@/lib/search-params";

type ArtifactSearchFieldProps = {
  projectName: string;
  /** Name of one of the project's artifacts, shown as an example. */
  exampleArtifact?: string;
  /** Search text currently applied (trimmed). */
  value: string;
  /** Called on every keystroke; results update as the user types. */
  onChange: (value: string) => void;
};

export function ArtifactSearchField({
  projectName,
  exampleArtifact,
  value,
  onChange,
}: ArtifactSearchFieldProps) {
  // The field keeps untrimmed text (e.g. a trailing space while typing) and
  // follows the applied search when it changes elsewhere, e.g. on back.
  const [text, setText] = useState(value);
  const [applied, setApplied] = useState(value);
  if (value !== applied) {
    setApplied(value);
    if (text.trim() !== value) setText(value);
  }

  return (
    <form role="search" onSubmit={(event) => event.preventDefault()}>
      <label className="relative flex items-center">
        <span className="sr-only">Search {projectName} artifacts</span>
        <Search
          aria-hidden
          className="pointer-events-none absolute left-4 size-5 text-neutral-700"
        />
        <Input
          type="search"
          value={text}
          maxLength={MAX_QUERY_LENGTH}
          autoComplete="off"
          placeholder={
            exampleArtifact
              ? `Search artifacts (e.g. ${exampleArtifact})`
              : "Search artifacts"
          }
          onChange={(event) => {
            setText(event.target.value);
            setApplied(event.target.value.trim());
            onChange(event.target.value);
          }}
          className="h-12 rounded-[1.25rem] border-neutral-300 bg-neutral-0 pr-4 pl-11 text-base leading-6 shadow-none placeholder:text-neutral-700 md:text-base"
        />
      </label>
    </form>
  );
}
