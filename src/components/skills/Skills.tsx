import { PeriodicTable } from "./PeriodicTable";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { skills } from "@/content/skills";

export function Skills({ index }: { index: string }) {
  return (
    <section id="skills" aria-labelledby="skills-title" className="section border-t border-line">
      <div className="container-page">
        <SectionHeading headingId="skills-title" index={index} label="Skills" lead="The periodic table" accent="of my stack." />
        <PeriodicTable skills={skills} />
      </div>
    </section>
  );
}
