import { Lanyard } from "./Lanyard";
import { QuickFacts } from "./QuickFacts";
import { Pill } from "@/components/ui/Pill";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { profile } from "@/content/profile";
import { pad2 } from "@/lib/sections";

export function About({ index }: { index: string }) {
  return (
    <section id="about" aria-labelledby="about-title" className="section">
      <div className="container-page grid items-start gap-14 lg:grid-cols-[1.05fr_0.9fr_1.05fr] lg:gap-10">
        <div>
          <SectionHeading headingId="about-title" index={index} label="About" lead="Hi, I’m" accent={`${profile.firstName}.`} />
          <div className="mt-8 space-y-4 text-[1.02rem] leading-relaxed text-ink/80" data-reveal>
            {profile.bio.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3" data-reveal>
            <Pill href={profile.links.resume} magnetic>
              Resume <span aria-hidden>↓</span>
            </Pill>
            <Pill href={profile.links.github} variant="outline" external>
              GitHub <span aria-hidden>↗</span>
            </Pill>
            <Pill href={profile.links.linkedin} variant="outline" external>
              LinkedIn <span aria-hidden>↗</span>
            </Pill>
          </div>
        </div>
        <Lanyard />
        <div className="space-y-10">
          <div data-reveal>
            <h3 className="label text-ink">What I do</h3>
            <ol className="mt-4 divide-y divide-line border-y border-line">
              {profile.whatIDo.map((item, i) => (
                <li key={item} className="flex items-baseline gap-4 py-3">
                  <span className="font-mono text-xs text-stone">{pad2(i + 1)}</span>
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ol>
          </div>
          <div data-reveal>
            <h3 className="label text-ink">Quick facts</h3>
            <QuickFacts />
          </div>
          <blockquote className="border-t border-line pt-6 font-serif text-2xl italic leading-snug" data-reveal>
            “{profile.quote}”
          </blockquote>
        </div>
      </div>
    </section>
  );
}
