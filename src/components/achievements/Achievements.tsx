import { AchievementsCarousel } from "./AchievementsCarousel";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { achievements } from "@/content/achievements";

export function Achievements({ index }: { index: string }) {
  return (
    <section id="achievements" aria-labelledby="achievements-title" className="section overflow-hidden border-t border-line">
      <div className="container-page">
        <SectionHeading headingId="achievements-title" index={index} label="Achievements" lead="Proud" accent="moments." />
      </div>
      <AchievementsCarousel items={achievements} />
    </section>
  );
}
