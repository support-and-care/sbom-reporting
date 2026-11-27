"use client";

import { Check, ChevronDown } from "lucide-react";
import Link from "next/link";
import { DropdownMenu } from "radix-ui";
import { routes } from "@/config/site";
import { cn } from "@/lib/utils";

export const menuContentStyles =
  "z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-(--radix-dropdown-menu-trigger-width) overflow-y-auto rounded-card border border-neutral-200 bg-neutral-0 py-2 shadow-lg";

export const menuItemStyles =
  "flex cursor-pointer items-center gap-3 px-4 py-2 text-caption text-neutral-800 outline-none select-none data-highlighted:bg-blue-50 data-highlighted:text-blue-700";

type VersionOption = { version: string; isLatest: boolean };

function versionLabel({ version, isLatest }: VersionOption): string {
  return isLatest ? `${version} · latest` : version;
}

type VersionMenuProps = {
  artifactName: string;
  versions: VersionOption[];
  selected: string;
};

/** Switches between the tracked versions of an artifact. */
export function VersionMenu({
  artifactName,
  versions,
  selected,
}: VersionMenuProps) {
  const current = versions.find((option) => option.version === selected);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={`Version ${current ? versionLabel(current) : selected}, choose another version`}
        className="flex h-9.5 w-fit min-w-46.25 items-center justify-between gap-2.5 rounded-[1.25rem] border border-neutral-100 bg-neutral-50 px-4 font-mono text-caption text-neutral-800 outline-none hover:border-neutral-300 focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:border-blue-700"
      >
        {current ? versionLabel(current) : selected}
        <ChevronDown aria-hidden className="size-4" strokeWidth={2.5} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className={menuContentStyles}
        >
          {versions.map((option) => (
            <DropdownMenu.Item key={option.version} asChild>
              <Link
                href={routes.artifact(artifactName, option.version)}
                aria-current={option.version === selected ? "page" : undefined}
                className={cn(menuItemStyles, "font-mono")}
              >
                <Check
                  aria-hidden
                  className={cn(
                    "size-3.5 text-blue-700",
                    option.version !== selected && "invisible",
                  )}
                  strokeWidth={3}
                />
                {versionLabel(option)}
              </Link>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
