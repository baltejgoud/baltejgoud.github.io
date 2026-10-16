import type { Milestone } from "@/content/types";

const kindLabel: Record<Milestone["kind"], string> = {
  education: "Education",
  experience: "Experience",
  next: "Next",
};

export function MilestoneCard({ milestone }: { milestone: Milestone }) {
  if (milestone.kind === "next") {
    return (
      <a
        href="#contact"
        className="group block rounded-[20px] border border-dashed border-ink/30 p-6 transition-colors duration-300 hover:border-ink hover:bg-paper"
      >
        <p className="label">{kindLabel.next}</p>
        <p className="mt-3 text-3xl font-extrabold tracking-tight">{milestone.role}</p>
        <p className="mt-2 text-stone">
          {milestone.org}{" "}
          <span aria-hidden className="inline-block transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </p>
      </a>
    );
  }
  return (
    <article className="rounded-[20px] border border-line bg-paper p-6 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <p className="label text-ink">{kindLabel[milestone.kind]}</p>
        {milestone.dates && <p className="font-mono text-xs text-stone">{milestone.dates}</p>}
      </div>
      <h3 className="mt-4 text-xl font-extrabold tracking-tight">{milestone.role}</h3>
      <p className="mt-1 text-sm font-medium text-stone">{milestone.org}</p>
      <ul className="mt-4 space-y-2">
        {milestone.bullets.map((bullet) => (
          <li key={bullet} className="flex gap-2.5 text-sm leading-relaxed">
            <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-ink" />
            {bullet}
          </li>
        ))}
      </ul>
      <ul className="mt-5 flex flex-wrap gap-1.5">
        {milestone.tags.map((tag) => (
          <li key={tag} className="rounded-full bg-cream px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-stone">
            {tag}
          </li>
        ))}
      </ul>
    </article>
  );
}
