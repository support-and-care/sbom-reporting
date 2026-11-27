"use client";

import { ChevronDown } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import {
  menuContentStyles,
  menuItemStyles,
} from "@/components/artifact/VersionMenu";
import { routes } from "@/config/site";
import { SBOM_FORMATS, type SbomFormat } from "@/lib/artifact";

const formats = Object.entries(SBOM_FORMATS) as [SbomFormat, string][];

/** Offers the version's SBOM for download in each CycloneDX format. */
export function DownloadSbomMenu({ uuid }: { uuid: string }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="flex w-full items-center justify-center gap-2.5 rounded-pill bg-blue-700 p-4 font-display text-[1.3125rem] leading-6 font-semibold text-neutral-0 outline-none hover:bg-blue-800 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-offset-2">
        Download SBOM
        <ChevronDown aria-hidden className="size-5" strokeWidth={2.5} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="center"
          sideOffset={8}
          className={menuContentStyles}
        >
          {formats.map(([format, label]) => (
            <DropdownMenu.Item key={format} asChild>
              <a
                href={routes.sbom(uuid, format)}
                download
                className={menuItemStyles}
              >
                {label}
              </a>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
