import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";
import { pageItems } from "@/lib/project-artifacts";
import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  pageCount: number;
  /** URL of a page, so links still open in a new tab; buttons without it. */
  href?: (page: number) => string;
  onSelect: (page: number) => void;
  /** Names the navigation, e.g. `Artifact pages`. */
  label?: string;
};

function PageLink({
  page,
  href,
  onSelect,
  className,
  children,
  ...props
}: {
  page: number;
  href: PaginationProps["href"];
  onSelect: PaginationProps["onSelect"];
  className: string;
  children: ReactNode;
  "aria-label": string;
}) {
  if (!href) {
    return (
      <button
        type="button"
        onClick={() => onSelect(page)}
        className={cn("cursor-pointer", className)}
        {...props}
      >
        {children}
      </button>
    );
  }

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    // Let the browser handle new-tab and new-window clicks.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    onSelect(page);
  }
  return (
    <a href={href(page)} onClick={handleClick} className={className} {...props}>
      {children}
    </a>
  );
}

const stepStyles =
  "flex h-10 items-center gap-2 px-1 text-caption text-slate-500 [&_svg]:size-3.5";

export function Pagination({
  page,
  pageCount,
  href,
  onSelect,
  label = "Artifact pages",
}: PaginationProps) {
  const step = (target: number, label: string, children: ReactNode) =>
    target < 1 || target > pageCount ? (
      <span aria-disabled className={cn(stepStyles, "opacity-60")}>
        {children}
      </span>
    ) : (
      <PageLink
        page={target}
        href={href}
        onSelect={onSelect}
        aria-label={label}
        className={cn(stepStyles, "hover:text-blue-700 [&_svg]:text-blue-700")}
      >
        {children}
      </PageLink>
    );

  return (
    <nav aria-label={label} className="flex items-center gap-4 sm:gap-8.5">
      {step(
        page - 1,
        "Previous page",
        <>
          <ChevronLeft aria-hidden strokeWidth={2.5} />
          prev
        </>,
      )}
      <p className="text-caption text-slate-700 sm:hidden">
        Page {page} of {pageCount}
      </p>
      <ol className="hidden items-center gap-x-2.25 sm:flex">
        {pageItems(page, pageCount).map((item, index) =>
          item === "ellipsis" ? (
            <li
              key={`ellipsis-${index}`}
              aria-hidden
              className="grid size-10 place-items-center text-caption text-slate-700"
            >
              …
            </li>
          ) : (
            <li key={item}>
              {item === page ? (
                <span
                  aria-current="page"
                  className="grid size-10 place-items-center rounded-[0.625rem] bg-blue-700 text-caption text-blue-50"
                >
                  {item}
                </span>
              ) : (
                <PageLink
                  page={item}
                  href={href}
                  onSelect={onSelect}
                  aria-label={`Page ${item}`}
                  className="grid h-10 min-w-10 place-items-center rounded-[0.625rem] px-1 text-caption text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                >
                  {item}
                </PageLink>
              )}
            </li>
          ),
        )}
      </ol>
      {step(
        page + 1,
        "Next page",
        <>
          next
          <ChevronRight aria-hidden strokeWidth={2.5} />
        </>,
      )}
    </nav>
  );
}
