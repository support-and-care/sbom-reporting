import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { ProjectsSection } from "@/components/landing/ProjectsSection";
import { pageContainerStyles } from "@/components/layout/pageContainer";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <div className={cn(pageContainerStyles, "mt-20 mb-43 flex flex-col")}>
        <ProjectsSection />
        <hr className="mt-23 mb-10 border-neutral-600" />
        <HowItWorksSection />
      </div>
    </>
  );
}
