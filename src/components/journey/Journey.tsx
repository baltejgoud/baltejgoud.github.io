import { JourneyTimeline } from "./JourneyTimeline";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { journey } from "@/content/journey";

export function Journey({ index }: { index: string }) {
  return (
    <section id="experience" aria-labelledby="experience-title" className="section overflow-hidden border-t border-line">
      <div className="container-page">
        <SectionHeading headingId="experience-title" index={index} label="Journey" lead="Education &" accent="experience." />
        <JourneyTimeline milestones={journey} />
      </div>
    </section>
  );
}
