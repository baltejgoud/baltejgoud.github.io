interface SectionHeadingProps {
  headingId: string;
  /** Two-digit section number; omitted for unnumbered sections */
  index?: string;
  label: string;
  lead: string;
  accent: string;
  className?: string;
}

/** "01 — ABOUT" label over a bold sans lead and an italic serif accent. */
export function SectionHeading({ headingId, index, label, lead, accent, className }: SectionHeadingProps) {
  return (
    <div className={className}>
      <p className="label" data-reveal>
        {index ? `${index} — ${label}` : label}
      </p>
      <h2 id={headingId} className="section-title mt-5" data-reveal="mask">
        <span className="mask">
          <span>{lead}</span>
        </span>{" "}
        <span className="mask">
          <span className="accent">{accent}</span>
        </span>
      </h2>
    </div>
  );
}
