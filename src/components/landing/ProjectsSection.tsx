import { ProjectCard } from "@/components/landing/ProjectCard";
import { trackedProjects } from "@/content/landing";

export function ProjectsSection() {
  return (
    <section
      id="projects"
      aria-labelledby="projects-title"
      className="flex flex-col gap-8"
    >
      <h2
        id="projects-title"
        className="font-display text-3xl font-semibold sm:text-4xl"
      >
        Overview of Tracked Projects
      </h2>
      <ul className="grid gap-8 md:grid-cols-2 md:gap-22">
        {trackedProjects.map((project) => (
          <li key={project.slug} className="flex">
            <ProjectCard project={project} />
          </li>
        ))}
      </ul>
    </section>
  );
}
