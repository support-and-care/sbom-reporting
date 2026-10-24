import { snapshotDate } from "@/content/landing";
import { formatDate } from "@/lib/format";

export function SnapshotBar() {
  return (
    <div className="container-box">
      <p className="border-b border-green-300 pt-8 pb-4 text-right text-base leading-6.5">
        All data from snapshot:{" "}
        <time dateTime={snapshotDate} className="font-semibold">
          {formatDate(snapshotDate)}
        </time>
      </p>
    </div>
  );
}
