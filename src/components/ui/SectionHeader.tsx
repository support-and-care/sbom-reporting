type SectionHeaderProps = {
  id: string;
  title: string;
  intro: string;
};

export function SectionHeader({ id, title, intro }: SectionHeaderProps) {
  return (
    <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
      <div>
        <span
          aria-hidden
          className="bg-blue mb-6 block h-1 w-16 rounded-full"
        />
        <h2
          id={id}
          className="lg:text-section text-3xl leading-tight font-light sm:text-4xl"
        >
          {title}
        </h2>
      </div>
      <p className="max-w-3xl text-base leading-7 font-medium lg:justify-self-end lg:text-lg">
        {intro}
      </p>
    </div>
  );
}
