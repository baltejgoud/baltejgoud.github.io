import { ProjectAccordion } from "./ProjectAccordion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { projects } from "@/content/projects";

export function Work({ index }: { index: string }) {
  return (
    <section id="work" aria-labelledby="work-title" className="section border-t border-line">
      <div className="container-page">
        <SectionHeading headingId="work-title" index={index} label="Selected work" lead="Things I’ve" accent="built." />
        <ProjectAccordion projects={projects} />
      </div>
    </section>
  );
}
