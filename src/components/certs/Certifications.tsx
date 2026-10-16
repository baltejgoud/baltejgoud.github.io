import { SectionHeading } from "@/components/ui/SectionHeading";
import { certifications } from "@/content/certifications";
import type { Certification } from "@/content/types";
import { pad2 } from "@/lib/sections";

const row =
  "group grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-4 px-4 py-6 transition-colors duration-[250ms] hover:bg-ink hover:text-cream focus-visible:bg-ink focus-visible:text-cream";

function Row({ cert, n }: { cert: Certification; n: number }) {
  return (
    <>
      <span className="font-mono text-xs text-stone group-hover:text-cream/60">{pad2(n)}</span>
      <span>
        <span className="block font-semibold">{cert.title}</span>
        <span className="mt-1 block text-sm text-stone group-hover:text-cream/70">
          {cert.issuer}
          {cert.year ? ` · ${cert.year}` : ""}
        </span>
      </span>
      <span aria-hidden className="text-lg">
        ↗
      </span>
    </>
  );
}

/** Renders nothing until content/certifications.ts has entries. */
export function Certifications({ index }: { index?: string }) {
  if (certifications.length === 0 || !index) return null;
  return (
    <section id="certifications" aria-labelledby="certifications-title" className="section border-t border-line">
      <div className="container-page grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading headingId="certifications-title" index={index} label="Certifications" lead="Always" accent="learning." />
          <p className="mt-6 font-mono text-sm text-stone">{pad2(certifications.length)} certifications</p>
        </div>
        <ol className="border-t border-line">
          {certifications.map((cert, i) => (
            <li key={`${cert.issuer}-${cert.title}`} className="border-b border-line" data-reveal>
              {cert.href ? (
                <a href={cert.href} target="_blank" rel="noopener noreferrer" className={row}>
                  <Row cert={cert} n={i + 1} />
                </a>
              ) : (
                <div className={row}>
                  <Row cert={cert} n={i + 1} />
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
