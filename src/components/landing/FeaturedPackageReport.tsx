"use client";

import { useEffect, useState } from "react";
import { PackageReportCard } from "@/components/landing/PackageReportCard";
import type { PackageReport } from "@/lib/data/report";
import {
  FEATURED_ROTATION_MS,
  featuredIndex,
  featuredSlot,
} from "@/lib/featured";

type FeaturedPackageReportProps = {
  reports: PackageReport[];
  /** Rotation slot the server rendered, so hydration matches. */
  initialSlot: number;
  className?: string;
};

/**
 * Package report card that features another package every
 * {@link FEATURED_ROTATION_MS}, following the clock rather than page loads.
 * Pauses while hovered so the numbers can be read.
 */
export function FeaturedPackageReport({
  reports,
  initialSlot,
  className,
}: FeaturedPackageReportProps) {
  const [slot, setSlot] = useState(initialSlot);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    let timer: ReturnType<typeof setTimeout>;
    function tick() {
      const now = Date.now();
      setSlot(featuredSlot(now));
      // Wake up at the start of the next slot.
      timer = setTimeout(
        tick,
        FEATURED_ROTATION_MS - (now % FEATURED_ROTATION_MS),
      );
    }
    tick();
    return () => clearTimeout(timer);
  }, [paused]);

  return (
    <div
      className={className}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <PackageReportCard
        report={reports[featuredIndex(slot, reports.length)]}
      />
    </div>
  );
}
