import { howItWorksSteps } from "@/content/landing";

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="flex flex-col gap-8"
    >
      <h2 id="how-it-works-title" className="text-3xl font-semibold">
        How it works
      </h2>
      <ol className="grid gap-6 md:grid-cols-3 md:gap-15">
        {howItWorksSteps.map((step) => (
          <li
            key={step.title}
            className="flex min-h-25 flex-col justify-center gap-3.5 rounded-3xl bg-blue-50 py-3 pr-4 pl-7"
          >
            <span className="text-xl font-bold text-blue-800">
              {step.title}
            </span>
            <span className="text-base text-neutral-600">
              {step.description}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
