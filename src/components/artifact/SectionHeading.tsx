import { formatNumber } from "@/lib/format";

type SectionHeadingProps = {
  id: string;
  title: string;
  count?: number;
  description: string;
};

export function SectionHeading({
  id,
  title,
  count,
  description,
}: SectionHeadingProps) {
  return (
    <div className="flex flex-col gap-2">
      <h2
        id={id}
        className="font-display text-[1.4375rem] font-bold text-neutral-800"
      >
        {title}
        {count !== undefined && (
          <span className="text-[1.0625rem] text-slate-500">
            {" "}
            ({formatNumber(count)})
          </span>
        )}
      </h2>
      <p className="text-[0.9375rem] text-slate-500">{description}</p>
    </div>
  );
}
