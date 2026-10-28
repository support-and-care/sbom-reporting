import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { ProjectsSection } from "@/components/landing/ProjectsSection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <div className="mx-auto mt-20 mb-43 flex w-full max-w-288 flex-col px-6 xl:px-0">
        <ProjectsSection />
        <hr className="mt-23 mb-10 border-neutral-600 xl:-mx-12" />
        <HowItWorksSection />
      </div>
    </>
  );
}
